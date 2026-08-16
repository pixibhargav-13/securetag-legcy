-- ============================================================
--  SecureTag LEGACY schema  (app.securetag.in / /found system)
--  Separate from the vehicle `tags` table. Safe to re-run.
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- legacy_tags (generic items: luggage, wallet, bag, ...) ----------
-- One row per PHYSICAL printed code (all 1,498). `claimed` = a real owner
-- registered it in the old system (84 of them). The rest are blank/claimable.
create table if not exists public.legacy_tags (
  id              text primary key,        -- 6-char code, CASE-SENSITIVE (e.g. 8DdEeF)
  claimed         boolean not null default false,
  item_name       text,                    -- old st_tags.name  ("American Tourister")
  item_type       text,                    -- old intendedUse   (TRAVELLUGGAGE, WALLET...)
  owner_name      text,
  email           text,
  phone           text,                    -- primary, cleaned (+91...)
  alt_phone       text,                    -- second number if the owner listed two
  message         text,                    -- description + details
  address         text,                    -- street + city + state + country
  city            text,
  state           text,
  country         text,
  lost_mode       boolean not null default false,  -- old status == 'LOST'
  status_raw      text,                    -- original status (AVAILABLE / LOST)
  pref_contact    text,                    -- EMAIL / PHONE (controls what a finder sees)
  url_prefix      text,                    -- which domain it was printed on
  legacy_owner_id text,                    -- old Cognito sub (for future account re-link)
  imported_at     timestamptz not null default now()
);

-- Backfill-safe column adds (in case an older version of this table exists)
alter table public.legacy_tags add column if not exists alt_phone       text;
alter table public.legacy_tags add column if not exists pref_contact    text;
alter table public.legacy_tags add column if not exists url_prefix      text;
alter table public.legacy_tags add column if not exists legacy_owner_id text;

-- ---------- legacy_scans (optional: historical scan audit, 296 rows) ----------
create table if not exists public.legacy_scans (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  device_info text,
  ip_address  text,
  lat         double precision,
  lng         double precision,
  scanned_on  text,                        -- original Year/Quarter/Month/Day label
  imported_at timestamptz not null default now()
);
create index if not exists legacy_scans_code_idx on public.legacy_scans(code);

-- ---------- Row Level Security ----------
-- The legacy app reads these tables ONLY server-side with the service-role key,
-- which bypasses RLS. We enable RLS with NO public policy, so contact details
-- are never exposed to the anon/public client. This is the privacy default.
alter table public.legacy_tags  enable row level security;
alter table public.legacy_scans enable row level security;

-- (No select/insert policies on purpose: only the service role can touch these.)
