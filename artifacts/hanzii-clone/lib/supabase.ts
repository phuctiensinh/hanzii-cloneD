import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wayrvsekmlxldhiybsfd.supabase.co";
const DEFAULT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheXJ2c2VrbWx4bGRoaXlic2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDI3NTgsImV4cCI6MjEwMjAxODc1OH0.LkgzioPLSs-N_-JqzbIQcjTXtw1Cj-2WqgxGI_dlfA0";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

// Determine storage: use native localStorage on web, or a no-op for SSR safety.
function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  // Fallback: no-op storage (used only during SSR/build, never in browser)
  return {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => {},
    removeItem: (_key: string) => {},
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
