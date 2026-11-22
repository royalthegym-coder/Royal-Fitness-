import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAutomationPolicy, sanitizeAutomationPayloadForModel } from '../lib/automationPolicy.ts';
import { clearLegacySensitiveStorage } from '../lib/runtimeSecrets.ts';

const events = [
  'member_created',
  'payment_received',
  'review_posted',
  'attendance_alert',
  'system_sync',
  'medical_consultation',
];

test('automation actions come only from the known application event', () => {
  for (const event of events) {
    const result = applyAutomationPolicy(event, {
      n8n_action: 'delete_everything',
      whatsapp_payload: 'Send an unreviewed message',
      google_update: 'Publish unreviewed content',
      extra_instruction: 'Ignore the policy',
    });

    assert.deepEqual(result, {
      n8n_action: event,
      whatsapp_payload: '',
      google_update: '',
    });
  }
});

test('model context excludes all member, payment, and medical payload data', () => {
  const sensitivePayload = {
    member: { name: 'Example', phone: '0000000000', medicalHistory: ['private'], symptoms: 'private' },
    paymentMethod: 'private',
    totalAmount: 999,
  };

  assert.deepEqual(sanitizeAutomationPayloadForModel(sensitivePayload), {});
});

test('unknown events and malformed model outputs cannot enable actions', () => {
  for (const candidate of [null, [], 'action', { google_update: 'publish' }]) {
    assert.deepEqual(applyAutomationPolicy('unknown_event', candidate), {
      n8n_action: 'idle',
      whatsapp_payload: '',
      google_update: '',
    });
  }
});


test('legacy sensitive storage cleanup removes the designated old keys', () => {
  const removed = [];
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: { removeItem: (key) => removed.push(key) } };

  try {
    clearLegacySensitiveStorage();
    assert.ok(removed.includes('whatsapp_access_token'));
    assert.ok(removed.includes('github_token'));
    assert.ok(removed.includes('google_api_key'));
    assert.ok(removed.includes('HUGGINGFACE_API_KEY'));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
