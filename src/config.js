export const SUPABASE_URL = 'https://dyxhlzkexocssniiubxh.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oe0TUd3KwdVEiduqkO7rlA_QrSdBpL4';
export const VAPID_PUBLIC_KEY = 'BMBfvhM-_FNu-tUY6CLVYaJHU9tHHRjzl7EY-_GOfvgiYPPknQLGnVEngXTLv0NOHvHHFREQHd4mk0XaHioKvGA';

export function getSupabaseConfig() {
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

export function getConfig() {
  return { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY };
}
export function saveConfig() { return getConfig(); }
export function clearConfig() {}
export function isCloudConfigured() { return true; }
export function hasRemoteConfig() { return true; }
