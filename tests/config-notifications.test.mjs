import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseConfig } from '../src/config.js';
import { detectPushCapability, urlBase64ToUint8Array } from '../src/notifications.js';

test('uses built-in project config', () => {
  const cfg = getSupabaseConfig();
  assert.equal(cfg.url, 'https://dyxhlzkexocssniiubxh.supabase.co');
  assert.match(cfg.key, /^sb_publishable_/);
});

test('detects supported push environment', () => {
  const result = detectPushCapability({
    navigator: { serviceWorker: {}, PushManager: function() {} },
    Notification: { permission: 'default' }
  });
  assert.equal(result.supported, true);
  assert.equal(result.permission, 'default');
});

test('detects missing PushManager', () => {
  const result = detectPushCapability({
    navigator: { serviceWorker: {} },
    Notification: { permission: 'default' }
  });
  assert.equal(result.supported, false);
  assert.equal(result.pushManager, false);
});

test('converts base64url VAPID key', () => {
  assert.deepEqual(Array.from(urlBase64ToUint8Array('AQID')), [1, 2, 3]);
});
