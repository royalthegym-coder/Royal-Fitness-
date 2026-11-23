# 💳 Multi-Tenant Razorpay Subscriptions (UPI eMandate) Integration Architecture

This architectural blueprint outlines how to bootstrap recurring Indian payments (UPI Autopay/eMandate) securely inside your React client, Supabase ledger, and n8n trigger loops.

---

## 1. System Topology Flow

```
[ React UI Client ] 
       │ 
       ├─ (1) Initiates eMandate Razorpay Checkout overlay via Generic Key ID
       ▼ 
[ User UPI Auth ] (e.g., GPay / PhonePe Autopay Signature)
       │
       ├─ (2) Authorizes recurring debit consent (Max threshold upper bound)
       ▼
[ Razorpay Gateways ] 
       │
       ├─ (3) Emits verified 'payment.authorized' or 'subscription.charged' Webhook
       ▼
[ n8n Webhook Listener Router ] 
       │
       ├─ (4) Validates Signature (HMAC-SHA256 Timing-Safe Comparison API)
       ├─ (5) Generates PDF Invoice Receipt via Cloud Rendering Microservice
       ├─ (6) Direct-Pipes PDF link & Success updates to Supabase Invoice database
       └─ (7) Sends a WhatsApp template receipt message to client phone number
```

---

## 2. Frontend React Logic Setup

To instantiate the Razorpay checkout overlay with custom properties:

```typescript
import { useState } from 'react';

export function initializeRazorpayMandate(options: {
  keyId: string;
  subscriptionId: string;
  name: string;
  email: string;
  contact: string;
  amount: number;
  maxLimit: number;
}) {
  const rzpOptions = {
    key: options.keyId,
    subscription_id: options.subscriptionId,
    name: 'Neural Fitness Systems',
    description: 'UPI eMandate Recurring billing',
    image: 'https://your-domain.com/logo.png',
    handler: function (response: any) {
      console.log('Handshake Authorized:', response.razorpay_payment_id);
    },
    prefill: {
      name: options.name,
      email: options.email,
      contact: options.contact
    },
    notes: {
      mandate_max_limit: String(options.maxLimit)
    },
    theme: {
      color: '#A855F7'
    }
  };

  const RazorpayConstructor = (window as any).Razorpay;
  const instance = new RazorpayConstructor(rzpOptions);
  instance.open();
}
```

---

## 3. Webhook Signature Verification API (NodeJS Express)

Always process payment event alerts server-side. Never rely strictly on client redirect callbacks.

```javascript
import crypto from 'crypto';

export function verifyRazorpayWebhook(
  rawBody: string, 
  signatureHeader: string, 
  webhookSecret: string
): boolean {
  const computed = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computed, 'utf-8'),
    Buffer.from(signatureHeader, 'utf-8')
  );
}
```

---

## 4. n8n Node Workflow Specifications

1. **Webhook Listener Node**: Listens on `POST /webhooks/razorpay`.
2. **Signature Filter Code Block**: Executes cryptographic validation. Stops run if signatures fail.
3. **Receipt Renderer Tool**: Submits parameters (amount, customer, period) to HTML-to-PDF server API. Returns a temporary PDF URL.
4. **Supabase Direct Update Node**: Mutates `subscription_invoices` with `status: 'paid'`, `pdf_receipt_url: '...'`, and `razorpay_payment_id`.
5. **WhatsApp Message API Node**: Transmits metadata template utilizing WhatsApp Cloud API.
