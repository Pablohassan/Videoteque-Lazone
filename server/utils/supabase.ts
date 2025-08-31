import { createClient } from "@supabase/supabase-js";

// Client Supabase pour les opérations avancées (stockage, real-time, etc.)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client Supabase pour les opérations frontend (avec clé anonyme)
export const createSupabaseClient = () => {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};
