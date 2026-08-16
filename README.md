# SecureTag Legacy (`app.securetag.in`)

Revives the **pre-2024 generic SecureTag** system (luggage, wallets, bags, …).
Serves the old physical QR codes at **`/found/<code>`**. Completely separate from
the current vehicle app (`securetag.in`, `/tag/<code>`) — different table, different
deployment — sharing the **same Supabase project**.

## Architecture

```
app.securetag.in/found/<code>   →  this app          →  public.legacy_tags
securetag.in/found/<code>       →  301 (vehicle app) →  app.securetag.in/found/<code>
securetag.in/tag/<code>         →  vehicle app (unchanged)
```

Privacy rule (reproduced from the old system): a finder sees the owner's contact
details **only when the owner has set the item to LOST**. Otherwise the page shows
"secured — contact support". Data is read **server-side only** via the service-role
key; `legacy_tags` has RLS on with no public policy.

## One-time setup

1. **Create the tables** — paste `supabase-legacy-schema.sql` into
   Supabase → SQL Editor → Run.
2. **Env** — `.env.local` needs (already generated locally):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Import the data**
   ```
   npm run import:dry   # validate, no writes
   npm run import       # upsert all 1,498 codes + scan history
   ```
   Idempotent — safe to re-run (upsert on `id`).

## Deploy (Vercel)

1. New Vercel project → import this folder/repo.
2. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   (and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if added later).
3. Add domain **`app.securetag.in`**; point its DNS (CNAME → `cname.vercel-dns.com`)
   at the registrar.
4. On the **vehicle** project, redeploy so the `/found/*` → `app.securetag.in`
   redirect (in its `next.config.mjs`) goes live for the 125 root-domain tags.

## Local dev

```
npm run dev        # http://localhost:3200
```
Try `/found/eYyZz0` (a LOST sample), `/found/7AaBbC` (secured), any 6-char
unknown code (not-registered page).
