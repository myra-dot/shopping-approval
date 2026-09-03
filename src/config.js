const KEY = 'shopping-approval-supabase-config';
export function getConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value.url || !value.anonKey) return null;
    return value;
  } catch { return null; }
}
export function saveConfig(config) {
  localStorage.setItem(KEY, JSON.stringify({ url: config.url.trim().replace(/\/$/, ''), anonKey: config.anonKey.trim() }));
}
export function clearConfig() { localStorage.removeItem(KEY); }
export function isCloudConfigured() { return Boolean(getConfig()); }
