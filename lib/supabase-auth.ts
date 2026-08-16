import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Shared with securetag.in when set (prod): `.securetag.in`. This lets the
// legacy app read the SAME login session as the main site.
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;

/**
 * Read-only Supabase client bound to the request cookies. Used only to detect
 * whether the scanner is a logged-in owner (session is issued by securetag.in
 * and shared across the .securetag.in subdomains).
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(COOKIE_DOMAIN ? { cookieOptions: { domain: COOKIE_DOMAIN, path: "/", sameSite: "lax", secure: true } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only: the legacy app never writes the session (no login here).
        },
      },
    }
  );
}

/** Returns the logged-in user's email (lowercased) or null. */
export async function getSessionEmail(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}
