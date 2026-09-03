# Realtime Push PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the two-person shopping approval site so the main URL connects directly to Supabase, foreground changes sync through Realtime, and supported Android browsers can receive background Web Push notifications.

**Architecture:** Keep GitHub Pages as a static client and Supabase as backend. Split browser capabilities into small modules for cloud config, Realtime, PWA registration, and push subscription; add a Supabase migration for subscription storage and an Edge Function for server-side Web Push. The existing polling path remains as a low-frequency fallback.

**Tech Stack:** HTML/CSS/ES modules, Supabase JS, Supabase Postgres/RLS/Realtime/Edge Functions, Service Worker, Web Push, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-03-realtime-push-pwa-design.md`

## Global Constraints

- Two Android users, primarily vivo Browser.
- Do not require changing browsers.
- Keep anonymous Supabase authentication.
- Keep GitHub Pages hosting.
- Frontend may contain only the Supabase publishable key; never service_role or Web Push private keys.
- Notify only for new request, approval, rejection, and resubmission.
- If Push APIs are unsupported, show an explicit degraded state while keeping foreground Realtime functional.
- `start.html` becomes compatibility-only; normal use starts from `index.html`.

---

### Task 1: Direct cloud configuration and testable browser capability helpers

**Files:**
- Modify: `src/config.js`
- Create: `src/notifications.js`
- Create: `tests/config-notifications.test.mjs`
- Create: `package.json`

**Interfaces:**
- Produces: `getSupabaseConfig(): {url:string,key:string}`
- Produces: `detectPushCapability(env): {supported:boolean, serviceWorker:boolean, pushManager:boolean, notification:boolean, permission:string}`
- Produces: `urlBase64ToUint8Array(value:string): Uint8Array`

- [ ] **Step 1: Write failing Node tests** covering built-in Supabase config, all-supported push capability, missing `PushManager`, and VAPID public-key conversion.

```js
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
    navigator: { serviceWorker: {}, PushManager: function(){} },
    Notification: { permission: 'default' }
  });
  assert.equal(result.supported, true);
  assert.equal(result.permission, 'default');
});

test('detects missing PushManager', () => {
  const result = detectPushCapability({ navigator: { serviceWorker: {} }, Notification: { permission: 'default' } });
  assert.equal(result.supported, false);
  assert.equal(result.pushManager, false);
});

test('converts base64url VAPID key', () => {
  assert.deepEqual(Array.from(urlBase64ToUint8Array('AQID')), [1,2,3]);
});
```

- [ ] **Step 2: Run `node --test tests/*.test.mjs`** and verify failure because the new module/functions do not yet exist.

- [ ] **Step 3: Implement `src/config.js`** with constants `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `getSupabaseConfig()` returning them directly, eliminating localStorage cloud bootstrap as a requirement.

- [ ] **Step 4: Implement `src/notifications.js`** with pure `detectPushCapability(env)` and `urlBase64ToUint8Array(value)` helpers.

- [ ] **Step 5: Add `package.json`** with `"type":"module"` and `"test":"node --test tests/*.test.mjs"`, then run `npm test` and verify PASS.

- [ ] **Step 6: Commit** `feat: add direct cloud config and notification capability detection`.

---

### Task 2: Realtime room synchronization with fallback polling

**Files:**
- Create: `src/realtime.js`
- Create: `tests/realtime.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: initialized Supabase client and current `room.id`.
- Produces: `subscribeToRoomRequests({supabase, roomId, onChange}): {unsubscribe:()=>Promise<void>}`

- [ ] **Step 1: Write a failing test** with a fake Supabase channel verifying it subscribes to `postgres_changes` for table `purchase_requests` and filter `room_id=eq.<uuid>`, and that both INSERT and UPDATE call `onChange`.

- [ ] **Step 2: Run `npm test`** and verify the Realtime test fails.

- [ ] **Step 3: Implement `src/realtime.js`** using `supabase.channel(...).on('postgres_changes', {event:'INSERT', schema:'public', table:'purchase_requests', filter:...}, onChange).on(...UPDATE...).subscribe()` and an unsubscribe wrapper calling `supabase.removeChannel(channel)`.

- [ ] **Step 4: Modify `index.html`** to import the direct config and Realtime helper, initialize Supabase automatically, subscribe once a room is known, refresh the request lists on Realtime callbacks, unsubscribe on room/session changes, and change fallback polling from 10 seconds to 60 seconds.

- [ ] **Step 5: Run `npm test` and perform syntax checks** with `node --check` on extracted/module JS files; verify PASS.

- [ ] **Step 6: Commit** `feat: add realtime request synchronization`.

---

### Task 3: Installable PWA and Service Worker

**Files:**
- Create: `manifest.webmanifest`
- Create: `sw.js`
- Create: `assets/icon.svg`
- Modify: `index.html`
- Modify: `start.html`
- Create: `tests/service-worker-contract.test.mjs`

**Interfaces:**
- Produces browser manifest with `start_url: "/shopping-approval/"` and `display: "standalone"`.
- Produces Service Worker handlers for `install`, `activate`, `fetch`, `push`, and `notificationclick`.

- [ ] **Step 1: Write a failing contract test** that reads `manifest.webmanifest` and `sw.js`, asserting the manifest start URL/display and presence of push + notification-click handlers.

- [ ] **Step 2: Run `npm test`** and verify failure because the PWA assets are absent.

- [ ] **Step 3: Create the manifest and icon** with app name “购物审批”, scope `/shopping-approval/`, and standalone display.

- [ ] **Step 4: Create `sw.js`** with a versioned static cache, conservative GET caching, `push` event parsing JSON payload into `showNotification`, and `notificationclick` opening/focusing `/shopping-approval/?request=<id>`.

- [ ] **Step 5: Modify `index.html`** to link the manifest, add theme metadata, register `./sw.js`, and show install/PWA status in settings where browser APIs permit.

- [ ] **Step 6: Replace `start.html`** with a compatibility redirect to `./` only; remove config-writing behavior.

- [ ] **Step 7: Run `npm test`** and verify PASS.

- [ ] **Step 8: Commit** `feat: make shopping approval installable as a PWA`.

---

### Task 4: Push subscription persistence with RLS

**Files:**
- Create: `supabase/migrations/20260903_push_subscriptions.sql`
- Create: `tests/push-subscription-sql.test.mjs`

**Interfaces:**
- Produces table `public.push_subscriptions(id uuid, user_id uuid, room_id uuid, endpoint text, p256dh text, auth text, user_agent text, created_at timestamptz, updated_at timestamptz)`.
- Unique subscription identity: `(user_id, endpoint)`.

- [ ] **Step 1: Write a failing SQL contract test** asserting the migration enables RLS, creates ownership policies based on `auth.uid() = user_id`, and defines the required unique constraint/index.

- [ ] **Step 2: Run `npm test`** and verify failure because the migration is absent.

- [ ] **Step 3: Write the migration** creating the table, indexes, updated-at trigger, RLS policies for SELECT/INSERT/UPDATE/DELETE on the current user's own subscriptions, and appropriate authenticated grants.

- [ ] **Step 4: Apply the migration to Supabase** and query metadata to verify the table exists and RLS is enabled.

- [ ] **Step 5: Run `npm test`** and verify PASS.

- [ ] **Step 6: Commit** `feat: persist web push subscriptions securely`.

---

### Task 5: Browser notification settings and subscription flow

**Files:**
- Modify: `src/notifications.js`
- Create: `tests/notification-subscribe.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces: `subscribeForPush({registration, publicKey}): Promise<PushSubscription>`
- Produces: `serializeSubscription(subscription): {endpoint:string,p256dh:string,auth:string}`
- UI persists serialized subscription with current `user_id` and `room_id` to `push_subscriptions`.

- [ ] **Step 1: Write failing tests** for `serializeSubscription` and for `subscribeForPush` passing `{userVisibleOnly:true, applicationServerKey:<Uint8Array>}` to `pushManager.subscribe`.

- [ ] **Step 2: Run `npm test`** and verify failure.

- [ ] **Step 3: Implement subscription helpers** in `src/notifications.js`.

- [ ] **Step 4: Modify settings UI** to show one of: “后台通知可开启”, “通知已开启”, “通知权限被拒绝”, or “当前 vivo 浏览器不支持后台推送；网页打开时仍会实时同步”. The enable button must only appear when capability detection returns supported and permission is not denied.

- [ ] **Step 5: On enable** request Notification permission, await Service Worker readiness, subscribe using the VAPID public key, and upsert the current user's subscription row. Do not place any private key in the frontend.

- [ ] **Step 6: Run `npm test` and JS syntax checks** and verify PASS.

- [ ] **Step 7: Commit** `feat: add push notification subscription settings`.

---

### Task 6: Server-side Web Push delivery

**Files:**
- Create: `supabase/functions/send-shopping-notification/index.ts`
- Create: `supabase/functions/send-shopping-notification/deno.json`
- Create: `tests/push-function-contract.test.mjs`

**Interfaces:**
- Edge Function accepts `{request_id:string, event_type:'created'|'approved'|'rejected'|'resubmitted'}` from an authenticated caller.
- It derives actor, request, room, and recipient from Supabase data; it does not accept an arbitrary recipient user ID.
- Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, plus server-side Supabase credentials supplied by the function environment.

- [ ] **Step 1: Write a failing contract test** asserting the function source contains auth verification, allowed event-type validation, room-member recipient derivation, subscription lookup, and no hardcoded private VAPID key.

- [ ] **Step 2: Run `npm test`** and verify failure.

- [ ] **Step 3: Implement the Edge Function** using authenticated request JWT validation, fetch the purchase request and room membership, reject callers who are not a member, derive the other member, load that member's push subscriptions, create event-specific title/body, and send standard Web Push to each subscription.

- [ ] **Step 4: Handle stale endpoints** by deleting subscriptions for terminal push responses such as 404/410; return aggregate `{sent, failed}` without exposing subscription secrets.

- [ ] **Step 5: Deploy the Edge Function and configure VAPID secrets** in Supabase. Generate a dedicated VAPID keypair if none exists; only the public key is copied into frontend config.

- [ ] **Step 6: Run `npm test`** and verify PASS.

- [ ] **Step 7: Commit** `feat: send shopping approval web push notifications`.

---

### Task 7: Trigger notifications from the four business actions

**Files:**
- Modify: `index.html`
- Create: `tests/notification-events.test.mjs`

**Interfaces:**
- Calls Supabase Function `send-shopping-notification` after successful database mutation with exact event types `created`, `approved`, `rejected`, `resubmitted`.
- Notification delivery failure must not roll back or falsely mark the purchase action as failed.

- [ ] **Step 1: Write failing tests** for a pure mapping helper ensuring submit→created, approve→approved, reject→rejected, resubmit→resubmitted.

- [ ] **Step 2: Run `npm test`** and verify failure.

- [ ] **Step 3: Implement the event mapping/helper** and invoke the Edge Function after each corresponding successful mutation. Catch push errors separately and surface at most a non-blocking toast/log.

- [ ] **Step 4: Run `npm test` and syntax checks** and verify PASS.

- [ ] **Step 5: Commit** `feat: notify the other shopper after approval actions`.

---

### Task 8: End-to-end verification and Pages deployment

**Files:**
- Modify: `README.md`
- Verify: `.github/workflows/pages.yml`

**Interfaces:**
- Public production URL: `https://myra-dot.github.io/shopping-approval/`.

- [ ] **Step 1: Run all automated tests** with `npm test`; expected all PASS.

- [ ] **Step 2: Verify Supabase database state**: anonymous sign-in enabled, existing room/request RLS enabled, `push_subscriptions` RLS enabled, private `product-images` bucket remains private.

- [ ] **Step 3: Deploy frontend through GitHub Pages** and inspect the newest workflow run until `status=completed` and `conclusion=success`.

- [ ] **Step 4: Test two-device foreground Realtime flow**: A creates/joins room, A submits, B sees it without refresh, B approves/rejects, A sees result without refresh, then test resubmit.

- [ ] **Step 5: Test vivo Browser push capability on both phones**. If unsupported, verify the exact degraded message and stop there; do not claim background push works. If supported, enable notification on both devices, background/close the page, perform each of the four actions, and verify system notification + click-through.

- [ ] **Step 6: Update README** with the single production URL, install/notification instructions, and the vivo Browser fallback behavior.

- [ ] **Step 7: Final verification**: re-run `npm test`, fetch the latest GitHub Pages workflow status, and report only capabilities that were actually observed in verification.
