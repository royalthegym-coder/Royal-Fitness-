# n8n event envelope and flow inventory (v1)

## Safe outbound contract

The only approved outbound body is the following fixed-shape event/status envelope:

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
`status` is a fixed literal, not a claim that an n8n workflow completed. Only the currently
wired `member_created` event is allowed. Payment and attendance labels are rejected too:
even an event name can disclose payment or personal attendance information. Health, review,
system-sync, unknown event names, and invalid timestamps are also rejected until an actual
trigger and an explicitly reviewed data boundary exist.

## Flow inventory

| Flow | Evidence in current app | Preparation / safe payload | Readiness and test |
|---|---|---|---|
| Member onboarding (`member_created`) | `ScientificAdmissionForm` calls `triggerAutomation` after `addMember`. | Envelope only: `event=member_created`, `status=occurred`; downstream may perform generic non-personal work only. | Already wired in app code. Unit test checks exact fields and rejects extra/member data. Downstream workflow existence and behavior are not verified. |
| Payment receipt | Payment-related code exists, but there is no `triggerAutomation` call for payment confirmation. | Excluded: even a `payment_received` label reveals payment status. | Not wired; webhook builder rejects payment event labels. Reconsider only with a newly reviewed scope that does not disclose payment status. |
| Attendance alert | Check-in records exist, but no production alert evaluator calls n8n. | Excluded: attendance-derived alert metadata is personal data even without a name. | Not wired; webhook builder rejects attendance labels. |
| Review signal | `GoogleBusiness` uses local sample state; no verified review-ingestion trigger exists. | No review text, author, rating, or identifiers; event label also not currently allowed. | Defer until a real source and boundary are reviewed; webhook builder rejects the label. |
| System sync | Type exists; the GitHub dispatch implementation in `triggerAutomation` is commented out. | No credentials or repository data; event label is not currently allowed. | Defer until a real sync action and trigger exist; webhook builder rejects the label. |
| Medical consultation | Was previously present as an event label, but no current `triggerAutomation` callsite was found. | Excluded entirely from n8n event allowlist; do not emit even the medical event label. | Negative test confirms the event is rejected. A separate Gemini consent decision does not authorize sending health-related metadata to n8n. |

## Test plan and operational boundary

`tests/automationPolicy.test.js` exercises the allowed member-created event with nested
member/payment/health fixtures, asserts the exact envelope key set and fixed status, and
checks that no sensitive fixture values appear. It rejects payment, attendance, health, review,
system-sync, unknown events, and invalid timestamps. Separate policy tests reject hostile model
actions. These are pure local unit tests and do not call `fetch` or any n8n endpoint.

The repo contains configurable onboarding, payment-sync and generic workflow URLs, but
this code inspection cannot establish that the remote workflows exist, are authenticated,
or behave safely. The browser client currently posts directly to the configured URL;
production hardening still needs a server-side authenticated proxy, delivery/retry and
idempotency design, and a confirmed workflow contract. No live webhook was called, edited,
or enabled for this preparation.
