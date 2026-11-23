# 🧠 Fitness Future: Behavioral Churn Prediction Engine spec
**Author:** Lead Data Scientist & Principal Systems Architect
**System:** Neural OS ("The Singularity") Full-Stack Integration Guide

---

## 1. Engine Core Design & Math
The Churn Engine analyzes multi-dimensional member engagement decay in real-time. Instead of simple binary flags, it uses weight-calibrated threat vectors to output a **Churn Risk Score (`0-100`)**.

### Model Feature Vectors
1. **Attendance Decay ($\Delta A$ - 45% Weight):**
   Percentage shrinkage in check-in frequency over the past 14 days relative to the member's historical baseline.
   $$\Delta A = \max\left(0.0, \frac{A_{\text{baseline}} - A_{\text{current}}}{A_{\text{baseline}}}\right)$$

2. **Workout Intensity Drops ($\Delta V$ - 15% Weight):**
   Decline in recorded lifted tonnage, completed sets, or active Heart Rate Zone duration.
   $$\Delta V = \max\left(0.0, \frac{V_{\text{baseline}} - V_{\text{current}}}{V_{\text{baseline}}}\right)$$

3. **Inactivity Duration ($I_{\text{absent}}$ - 30% Weight):**
   Elapsed days since the last turnstile sensor checkout swipe. The threat escalates linearly, hitting maximum sub-threat weight at 21 consecutive days absent.
   $$\text{Absence Score} = \min\left(1.0, \frac{I_{\text{absent}}}{21}\right)$$

4. **Billing Delinquency ($B_{\text{dues}}$ - 10% Weight):**
   Boolean penalty indicating outstanding payments or unpaid invoices.
   $$\text{Billing Score} = 1.0 \text{ if unpaid dues} \text{ else } 0.0$$

### Composite Threat Equation
$$\text{Risk Score} = \left( 45.0 \cdot \Delta A + 15.0 \cdot \Delta V + 30.0 \cdot \text{Absence Score} + 10.0 \cdot B_{\text{dues}} \right)$$

---

## 2. Supabase SQL Database Schema
Execute this on your Supabase SQL editor to bootstrap the metrics ledger and establish automated Postgres Webhook notification listeners:

```sql
-- Create behavioral churn risks metrics table
CREATE TABLE IF NOT EXISTS behavioral_churn_risks (
    member_id TEXT PRIMARY KEY,
    churn_risk_score INTEGER NOT NULL CHECK (churn_risk_score BETWEEN 0 AND 100),
    risk_bracket TEXT NOT NULL CHECK (risk_bracket IN ('LOW', 'MEDIUM', 'CRITICAL')),
    attendance_erosion NUMERIC(5,2) DEFAULT 0.00,
    volume_erosion NUMERIC(5,2) DEFAULT 0.00,
    consecutive_absent_days INTEGER DEFAULT 0,
    has_unpaid_dues BOOLEAN DEFAULT FALSE,
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Force Realtime replication sync for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE behavioral_churn_risks;

-- Create an trigger function to execute n8n webhook only for critical churn triggers (Score >= 80)
CREATE OR REPLACE FUNCTION notify_critical_churn_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.churn_risk_score >= 80 THEN
        PERFORM net.http_post(
            url := 'https://n8n.yourdomain.com/webhook/churn-critical-retention',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := json_build_object(
                'event', 'critical_churn_detected',
                'member_id', NEW.member_id,
                'churn_risk_score', NEW.churn_risk_score,
                'risk_bracket', NEW.risk_bracket,
                'consecutive_absent_days', NEW.consecutive_absent_days,
                'has_unpaid_dues', NEW.has_unpaid_dues,
                'predicted_at', NEW.predicted_at
            )::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hook Trigger on Table Updates/Inserts
CREATE TRIGGER on_member_churn_risk_profile
AFTER INSERT OR UPDATE ON behavioral_churn_risks
FOR EACH ROW
EXECUTE FUNCTION notify_critical_churn_trigger();
```

---

## 3. Python FastAPI Blueprint (`main.py`)
This microservice executes the analytics model and records the outcomes securely back into Supabase.

```python
import os
from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Fitness Future Behavioral Analytics OS")

# Security Access Relays
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ChurnPredictionRequest(BaseModel):
    member_id: str = Field(..., description="Unique member identifier")
    weekly_attendance_baseline: float = Field(..., ge=0, description="Average checkins per week historically")
    weekly_attendance_current: float = Field(..., ge=0, description="Average checkins in last 14 days")
    average_volume_baseline: float = Field(..., ge=0, description="Historical average workout intensity volume")
    average_volume_current: float = Field(..., ge=0, description="Current average workout intensity volume")
    consecutive_absent_days: int = Field(..., ge=0, description="Days elapsed since last turnstile swipe")
    has_unpaid_dues: bool = Field(False, description="Flag indicating if membership billing is outstanding")

@app.post("/api/predict-churn")
async def predict_churn(req: ChurnPredictionRequest):
    """
    Computes a precise Risk Score (0-100) based on engagement erosion and billing risk.
    Commits analytical forecasts back to the Supabase security ledger database.
    """
    try:
        # A. Compute Attendance Decline (45% weight)
        attendance_erosion = 0.0
        if req.weekly_attendance_baseline > 0:
            drop = req.weekly_attendance_baseline - req.weekly_attendance_current
            attendance_erosion = max(0.0, min(1.0, drop / req.weekly_attendance_baseline))
        
        # B. Compute Workout Tonnage drop (15% weight)
        volume_erosion = 0.0
        if req.average_volume_baseline > 0:
            drop = req.average_volume_baseline - req.average_volume_current
            volume_erosion = max(0.0, min(1.0, drop / req.average_volume_baseline))
            
        # C. Compute Absentees score (30% weight)
        absence_score = min(1.0, req.consecutive_absent_days / 21.0)

        # D. Synthesize final calibrated risk score
        churn_risk_score = (
            (attendance_erosion * 45.0) +
            (volume_erosion * 15.0) +
            (absence_score * 30.0) +
            (10.0 if req.has_unpaid_dues else 0.0)
        )
        
        final_score = int(round(max(0.0, min(100.0, churn_risk_score))))

        risk_bracket = "LOW"
        if final_score >= 80:
            risk_bracket = "CRITICAL"
        elif final_score >= 50:
            risk_bracket = "MEDIUM"

        # payload creation
        payload = {
            "member_id": req.member_id,
            "churn_risk_score": final_score,
            "risk_bracket": risk_bracket,
            "attendance_erosion": round(attendance_erosion * 100, 2),
            "volume_erosion": round(volume_erosion * 100, 2),
            "consecutive_absent_days": req.consecutive_absent_days,
            "has_unpaid_dues": req.has_unpaid_dues,
            "predicted_at": "now()"
        }

        # Safe upsert back to Supabase
        data, count = supabase.table("behavioral_churn_risks").upsert(payload, on_conflict="member_id").execute()

        return {
            "success": True,
            "member_id": req.member_id,
            "churn_risk_score": final_score,
            "risk_bracket": risk_bracket,
            "metrics": {
                "attendance_erosion_pct": round(attendance_erosion * 100, 1),
                "volume_erosion_pct": round(volume_erosion * 100, 1),
                "absence_days": req.consecutive_absent_days
            },
            "trigger_retention_automation": final_score >= 80,
            "db_response": data[1] if data and len(data) > 1 else payload
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 4. Exact n8n Webhook & Automated WhatsApp Campaign JSON Setup
Import this valid JSON directly into your **n8n Workflow Canvas** to instantly orchestrate the retention message campaign:

```json
{
  "name": "Fitness Future Churn Critical Campaign",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "churn-critical-retention",
        "options": {}
      },
      "id": "da14ab3e-a89b-4e12-b5df-14739eb3b1bf",
      "name": "Supabase Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 360]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.body.churn_risk_score }}",
              "operation": "largerEqual",
              "value2": 80
            }
          ]
        }
      },
      "id": "e98e4f1a-b620-410a-85ee-f3d7bc1050e1",
      "name": "Verify Critical Score >= 80",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [470, 360]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.whatsapp.com/v16.0/YOUR_PHONE_NUMBER_ID/messages",
        "authentication": "predefined",
        "nodeCredentialAuthorize": "facebookToken",
        "sendHeaders": true,
        "headersUi": {
          "parameter": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.body.member_phone }}\",\n  \"type\": \"template\",\n  \"template\": {\n    \"name\": \"fitness_future_retention_campaign\",\n    \"language\": {\n      \"code\": \"hi\"\n    },\n    \"components\": [\n      {\n        \"type\": \"body\",\n        \"parameters\": [\n          {\n            \"type\": \"text\",\n            \"text\": \"{{ $json.body.member_name }}\"\n          },\n          {\n            \"type\": \"text\",\n            \"text\": \"{{ $json.body.consecutive_absent_days }}\"\n          }\n        ]\n      }\n    ]\n  }\n}",
        "options": {}
      },
      "id": "c10d32df-348b-4b13-8ddf-81829e71f92e",
      "name": "Trigger Meta WhatsApp API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [720, 240]
    },
    {
      "parameters": {
        "message": "Member retained safely. System notified."
      },
      "id": "f290dbb3-c1ea-426c-843c-66286bc47970",
      "name": "Diagnostics Idle Log",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [720, 480]
    }
  ],
  "connections": {
    "Supabase Webhook Trigger": {
      "main": [
        [
          {
            "node": "Verify Critical Score >= 80",
            "index": 0
          }
        ]
      ]
    },
    "Verify Critical Score >= 80": {
      "main": [
        [
          {
            "node": "Trigger Meta WhatsApp API",
            "index": 0
          }
        ],
        [
          {
            "node": "Diagnostics Idle Log",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {}
}
```
