import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("placeholder-supabase-url") &&
    !supabaseAnonKey.includes("placeholder-anon-key") &&
    !supabaseUrl.includes("your-supabase-project") &&
    !supabaseAnonKey.includes("your-supabase-anon-key")
  );
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder-supabase-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
