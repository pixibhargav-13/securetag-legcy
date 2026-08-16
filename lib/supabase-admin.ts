import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 * legacy_tags / legacy_scans have RLS enabled with no public policy,
 * so ONLY this client (service role) can read them — contact details
 * are never exposed to the browser.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type LegacyTag = {
  id: string;
  claimed: boolean;
  item_name: string | null;
  item_type: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  message: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lost_mode: boolean;
  status_raw: string | null;
  pref_contact: string | null;
  url_prefix: string | null;
};
