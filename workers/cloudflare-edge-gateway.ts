export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WEBHOOK_HMAC_SECRET: string;
  N8N_WHATSAPP_WEBHOOK: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  MERCHANT_UPI?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Timestamp",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      // 0. Live Member Onboarding (/api/v1/onboard)
      if (url.pathname === "/api/v1/onboard" && request.method === "POST") {
        const body = await request.json() as Record<string, any>;
        const cleanName = String(body.name || "").trim();
        if (!cleanName || cleanName.length < 2) {
          return new Response(JSON.stringify({ error: "Valid member name is required" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
        const memberId = `mem_${Date.now()}`;
        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          await fetch(`${env.SUPABASE_URL}/rest/v1/members`, {
            method: "POST",
            headers: {
              "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: memberId,
              full_name: cleanName,
              email: body.email || null,
              phone_number: String(body.phone || "").replace(/^\+?91/, ""),
              status: "ACTIVE",
              inactivity_days: 0,
              updated_at: new Date().toISOString()
            })
          });
        }
        return new Response(JSON.stringify({
          success: true,
          memberId,
          fullName: cleanName,
          merchantUpi: body.merchantUpi || env.MERCHANT_UPI || "your-upi@bank"
        }), {
          status: 201,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // 1. Passkey Cryptographic Challenge Generator
      if (url.pathname === "/api/v2/auth/challenge" && request.method === "POST") {
        const challengeBuffer = new Uint8Array(32);
        crypto.getRandomValues(challengeBuffer);
        const challengeBase64 = btoa(String.fromCharCode(...challengeBuffer));
        
        return new Response(JSON.stringify({ challenge: challengeBase64 }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // 2. Bank & Merchant UPI Webhook HMAC-SHA256 Verification
      if (url.pathname === "/api/v2/payments/verify-webhook" && request.method === "POST") {
        const signatureHeader = request.headers.get("X-Signature");
        const timestampHeader = request.headers.get("X-Timestamp");
        const rawBody = await request.text();

        if (!signatureHeader || !timestampHeader) {
          return new Response(JSON.stringify({ error: "Missing cryptographic signature or timestamp" }), {
            status: 401,
            headers: CORS_HEADERS
          });
        }

        // Replay attack protection: reject payloads older than 5 minutes
        const parsedTs = parseInt(timestampHeader, 10);
        const requestAge = Date.now() - parsedTs;
        if (isNaN(requestAge) || Math.abs(requestAge) > 300000) {
          return new Response(JSON.stringify({ error: "Request timestamp outside valid window" }), {
            status: 403,
            headers: CORS_HEADERS
          });
        }

        // HMAC-SHA256 Signature Verification
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(env.WEBHOOK_HMAC_SECRET),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        const verified = await crypto.subtle.verify(
          "HMAC",
          key,
          hexToUint8Array(signatureHeader),
          encoder.encode(`${timestampHeader}.${rawBody}`)
        );

        if (!verified) {
          return new Response(JSON.stringify({ error: "HMAC signature mismatch. Unauthorized transaction." }), {
            status: 403,
            headers: CORS_HEADERS
          });
        }

        const payload = JSON.parse(rawBody);
        const memberId = payload.member_id || payload.memberId;
        const fullName = payload.full_name || payload.memberName || payload.fullName || "Member";
        const phoneNumber = String(payload.phone_number || payload.phoneNumber || payload.phone || "").replace(/^\+?91/, "");
        const planTier = payload.plan_tier || payload.planTier || "Standard";
        const txnReference = payload.txn_reference || payload.txnId || `TXN_${Date.now()}`;
        const amount = Number(payload.amount ?? 0);
        const merchantUpi = payload.merchant_upi || payload.merchantUpi || env.MERCHANT_UPI || "your-upi@bank";

        // Record transaction via Supabase REST API (Production Schema: payment_transactions)
        const supabaseRes = await fetch(`${env.SUPABASE_URL}/rest/v1/payment_transactions`, {
          method: "POST",
          headers: {
            "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            member_id: memberId,
            txn_reference: txnReference,
            amount: amount,
            merchant_upi: merchantUpi,
            status: "SUCCESS",
            hmac_signature: signatureHeader
          })
        });

        if (!supabaseRes.ok) {
          throw new Error("Failed to write transaction to Supabase ledger");
        }

        // Set member status to ACTIVE (Production Schema: members)
        await fetch(`${env.SUPABASE_URL}/rest/v1/members?id=eq.${memberId}`, {
          method: "PATCH",
          headers: {
            "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "ACTIVE",
            inactivity_days: 0,
            updated_at: new Date().toISOString()
          })
        });

        // Trigger production schema payload to n8n for WhatsApp receipt delivery
        const n8nPayload = {
          member_id: memberId,
          full_name: fullName,
          phone_number: phoneNumber,
          plan_tier: planTier,
          txn_reference: txnReference,
          amount: amount,
          merchant_upi: merchantUpi,
          status: "SUCCESS",
          hmac_signature: signatureHeader,
          whatsapp_phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID || undefined,
          event: "PAYMENT_SUCCESS_RECEIPT"
        };

        await fetch(env.N8N_WHATSAPP_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload)
        });

        return new Response(JSON.stringify({
          status: "VERIFIED_AND_PROCESSED",
          member_id: memberId,
          txn_reference: txnReference,
          amount: amount,
          phone_number: phoneNumber,
          merchant_upi: merchantUpi
        }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ status: "Neural Edge Gateway Active" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
  }
};

function hexToUint8Array(hexString: string): Uint8Array {
  const cleanHex = hexString.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}
