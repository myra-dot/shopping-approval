export function detectPushCapability(env = globalThis) {
  const navigatorObject = env.navigator || {};
  const serviceWorker = 'serviceWorker' in navigatorObject;
  const pushManager = 'PushManager' in navigatorObject;
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
