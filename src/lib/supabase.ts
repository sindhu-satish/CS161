import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  );

/** Browser Supabase client. Call only when {@link isSupabaseConfigured} is true. */
export const getSupabase = (): SupabaseClient => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase env missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
    );
  }
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return client;
};
