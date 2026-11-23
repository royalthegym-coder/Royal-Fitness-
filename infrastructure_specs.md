# Infrastructure & API Specifications (FITNESS FUTURE)

## 1. Meta WhatsApp Cloud API Payloads
These are the production-grade payloads for the WhatsApp Cloud API integration.

### Welcome Message Template
**Namespace:** `gym_onboarding`
**Template Name:** `welcome_bio_sync`
**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{member_phone}}",
  "type": "template",
  "template": {
    "name": "welcome_bio_sync",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "header",
        "parameters": [
          { "type": "image", "image": { "link": "https://fitnessfuture.com/assets/quantum_banner.png" } }
        ]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "{{member_name}}" },
          { "type": "text", "text": "{{gym_name}}" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          { "type": "text", "text": "app.fitnessfuture.com/sync" }
        ]
      }
    ]
  }
}
```

## 2. Webhook Idempotency Protocol
To ensure Razorpay and WhatsApp webhooks never process a transaction twice:

1. **Header Check:** Extract `x-razorpay-signature` and `x-whatsapp-message-id`.
2. **PostgreSQL Cache:** Check `webhook_logs` table before processing.
3. **Transaction Batching:** Execute database updates and logic inside a single SQL transaction.

### Webhook Log Table Schema
```sql
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- e.g., 'razorpay'
    external_id TEXT UNIQUE NOT NULL, -- e.g., 'pay_Nsh912...'
    status TEXT DEFAULT 'pending',
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Deployment Connectivity Checklist
- [ ] **Port 3000 Binding:** Ensure `server.ts` listens on `0.0.0.0:3000`.
- [ ] **Env Sync:** Map `GEMINI_API_KEY` and `RAZORPAY_SECRET` to Cloud Run secrets.
- [ ] **Whitelisting:** Add Clound Run IP range to Supabase Network Security.
