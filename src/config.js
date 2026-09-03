export const SUPABASE_URL = 'https://dyxhlzkexocssniiubxh.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oe0TUd3KwdVEiduqkO7rlA_QrSdBpL4';

export function getSupabaseConfig() {
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

// Compatibility aliases for the original modular client.
export function getConfig() {
  return { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY };
}
export function saveConfig() {}
export function clearConfig() {}
export function isCloudConfigured() { return true; }
