# n8n event envelope and flow inventory (v1)

## Safe outbound contract

The approved outbound body is a fixed-shape event/status envelope. The only currently
allowed event labels are `member_created` and `payment_received`:

```json
{
  "schema_version": 1,
  "event": "member_created",
  "source": "royal-fitness",
  "occurred_at": "2026-11-23T03:00:00.000Z",
  "status": "occurred"
}
```

No caller payload, member name/ID/contact, payment amount/method/transaction data,
health or medical details, model output, or arbitrary extra fields are permitted. The
`status` is a fixed literal, not a claim that an n8n workflow completed. The `payment_received` label and fixed `occurred` status are intentionally the full extent
of the payment signal; no invoice/member identifier, amount, method, transaction ID or receipt
data is sent. Only an explicit admin-confirmation action on a known non-Paid → `Paid` transition emits this event; member-side simulated payments and automated/demo status changes do not. This is the app's admin attestation, not independent payment-processor verification. Attendance, health, review, system-sync, unknown event names and invalid timestamps are rejected until separately reviewed.

## Flow inventory

| Flow | Evidence in current app | Preparation / safe payload | Readiness and test |
|---|---|---|---|
| Member onboarding (`member_created`) | `ScientificAdmissionForm` calls `triggerAutomation` after `addMember`. | Envelope only: `event=member_created`, `status=occurred`; downstream may perform generic non-personal work only. | Already wired in app code. Unit test checks exact fields and rejects extra/member data. Downstream workflow existence and behavior are not verified. |
| Payment status (`payment_received`) | `DataProvider.updateInvoiceStatus` records invoice status. Only Billing's explicit admin confirmation/approval calls opt into this event; member quick-pay and demo/automated paths do not. | Fixed event/status envelope only; no invoice/member identifier, amount, method, transaction ID, or receipt data. | Local trigger requires a known non-Paid → Paid transition plus admin confirmation. Tests cover authority, transitions, duplicate/already-paid states, and exact body. This is an admin attestation, not processor verification. |
| Attendance alert | Check-in records exist, but no production alert evaluator calls n8n. | Excluded: attendance-derived alert metadata is personal data even without a name. | Not wired; webhook builder rejects attendance labels. |
| Review signal | `GoogleBusiness` uses local sample state; no verified review-ingestion trigger exists. | No review text, author, rating, or identifiers; event label also not currently allowed. | Defer until a real source and boundary are reviewed; webhook builder rejects the label. |
| System sync | A type exists, but no active sync trigger is wired to this webhook service. | No credentials or repository data; event label is not currently allowed. | Defer until a real sync action and trigger exist; webhook builder rejects the label. |
| Medical consultation | Was previously present as an event label, but no current `triggerAutomation` callsite was found. | Excluded entirely from n8n event allowlist; do not emit even the medical event label. | Negative test confirms the event is rejected. A separate Gemini consent decision does not authorize sending health-related metadata to n8n. |

## Test plan and operational boundary

`tests/automationPolicy.test.js` exercises member-created and payment-received with sensitive
fixtures, asserts the exact envelope keys, and checks that member/payment values cannot leak.
Transition tests allow only admin-confirmed non-Paid → Paid and reject member/demo/automated changes, duplicate Paid, reversal, invalid invoice IDs, and missing invoices. One payment event is claimed per invoice per browser session. Attendance, health, review, system-sync, unknown events and invalid
timestamps are rejected. Transport tests use a mocked fetch function; no real request or n8n endpoint is called.

The repo contains configurable onboarding and payment-sync URLs, but this code inspection
cannot establish that the remote workflows exist, are authenticated, or behave safely. The
browser client posts directly to the configured URL, so server-side authentication, rate
limiting, a durable outbox, and cross-session idempotency are not implemented. HTTP non-2xx
responses are treated as failures; ambiguous network failures are not retried. The in-memory
per-invoice guard is session-local, not a durable or cross-device idempotency mechanism.
No live webhook was called, edited, or enabled for this preparation.
