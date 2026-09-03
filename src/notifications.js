export function detectPushCapability(env = globalThis) {
  const navigatorObject = env.navigator || {};
  const serviceWorker = 'serviceWorker' in navigatorObject;
  const pushManager = 'PushManager' in env;
  const notification = Boolean(env.Notification);
  const permission = notification ? env.Notification.permission : 'unsupported';
  return {
    supported: serviceWorker && pushManager && notification,
    serviceWorker,
    pushManager,
    notification,
    permission
  };
}

export function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof atob === 'function'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

export async function enablePush({ supabase, userId, roomId, vapidPublicKey, env = globalThis }) {
  const capability = detectPushCapability(env);
  if (!capability.supported) throw new Error('当前浏览器不支持后台推送');
  let permission = env.Notification.permission;
  if (permission === 'default') permission = await env.Notification.requestPermission();
  if (permission !== 'granted') throw new Error('通知权限未开启');
  const registration = await env.navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }
  const value = subscription.toJSON();
  const row = {
    user_id: userId,
    room_id: roomId,
    endpoint: value.endpoint,
    p256dh: value.keys?.p256dh,
    auth: value.keys?.auth,
    user_agent: env.navigator.userAgent || null
  };
  const { error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'user_id,endpoint' });
  if (error) throw error;
  return subscription;
}
