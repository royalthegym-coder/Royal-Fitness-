# n8n webhook contract (v1)

Royal Fitness sends an event-only envelope to the webhook URL selected for the event:

```json
{
  "schema_version": 1,
  "event": "member_created",
  "source": "royal-fitness",
  "occurred_at": "2026-11-23T03:00:00.000Z"
}
```

The envelope intentionally excludes caller payloads, member identifiers/contact details,
health information, payment details, and model-generated text. `event` is one of the
application's typed automation events; unknown event names and invalid timestamps are
not sent. The `schema_version` field allows a future contract migration without
silently changing v1 consumers.

Currently, the admission form invokes only `member_created`. Other event names are
allowed by the shared envelope type but are not wired to live app events. This repository
does not verify the downstream n8n workflows, their authentication, or what they do with
this envelope. No live webhook was called during development or testing.
