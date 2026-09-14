import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getAdminUser() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, isAdmin: false };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, isAdmin: false };
  const email = data.user?.email?.toLowerCase() ?? "";
  const admins = (process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return { user: data.user, isAdmin: Boolean(email && admins.includes(email)) };
}
