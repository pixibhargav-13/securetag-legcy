// ============================================================
//  SecureTag legacy data importer
//  Reads the old MongoDB CSV exports and upserts them into the
//  new Supabase `legacy_tags` (+ `legacy_scans`) tables.
//
//  Usage:
//    node scripts/import.mjs --dry-run     # parse + validate, NO DB writes
//    node scripts/import.mjs               # real upsert into Supabase
//    node scripts/import.mjs --scans       # also import scan audit history
//
//  Env (from ./.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_DIR = "D:/securetag clone/migrations_csv";

const DRY = process.argv.includes("--dry-run");
const WITH_SCANS = process.argv.includes("--scans") || !DRY;

// ---------- tiny .env.local loader (no dependency) ----------
function loadEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// ---------- minimal RFC-4180 CSV parser (handles quotes, commas, newlines) ----------
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, ""); // strip BOM
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const load = (name) => parseCSV(readFileSync(join(CSV_DIR, name), "utf8"));

// ---------- field cleaners ----------
function cleanPhones(raw) {
  if (!raw) return [];
  return raw
    .replace(/["']/g, "")          // drop Excel text-guard quotes/apostrophes
    .split(/[,;/]/)                // multiple numbers
    .map((s) => s.trim().replace(/\s+/g, ""))
    .filter((s) => /^\+?\d{7,15}$/.test(s));
}

function compose(parts, sep = ", ") {
  return parts.map((p) => (p || "").trim()).filter(Boolean).join(sep) || null;
}

function cleanMessage(description, details) {
  const d = (details || "").trim();
  const meaningfulDetails = d && d !== "{}" && d !== "null" ? d : "";
  return compose([description, meaningfulDetails], " — ");
}

// ============================================================
async function main() {
  loadEnv();

  const users = load("user_details.csv");
  const qrs = load("st_qr_codes.csv");
  const tags = load("st_tags.csv");

  // sub -> user
  const userBySub = new Map();
  for (const u of users) {
    const sub = u["sub"] || u["attributes.sub"];
    if (sub) userBySub.set(sub, u);
  }

  // code -> qr metadata (first occurrence wins)
  const qrByCode = new Map();
  for (const q of qrs) {
    const code = (q["qrCode"] || "").trim();
    if (code && !qrByCode.has(code)) qrByCode.set(code, q);
  }

  // code -> registered tag overlay
  const tagByCode = new Map();
  for (const t of tags) {
    const code = (t["qrCode"] || "").trim();
    if (!code) continue;
    const owner = userBySub.get((t["ownerId"] || "").trim());
    const ph = cleanPhones(t["phone"]);
    tagByCode.set(code, {
      item_name: (t["name"] || "").trim() || null,
      item_type: (t["intendedUse"] || "").trim() || null,
      owner_name: (owner?.["Full Name"] || owner?.["name_2"] || "").trim() || null,
      email: (t["email"] || owner?.["Email"] || "").trim() || null,
      phone: ph[0] || null,
      alt_phone: ph[1] || null,
      message: cleanMessage(t["description"], t["details"]),
      address: compose([t["streetAddress"], t["city"], t["state"], t["country"]]),
      city: (t["city"] || "").trim() || null,
      state: (t["state"] || "").trim() || null,
      country: (t["country"] || "").trim() || null,
      lost_mode: (t["status"] || "").trim().toUpperCase() === "LOST",
      status_raw: (t["status"] || "").trim() || null,
      pref_contact: (t["preferredModeOfContact"] || "").trim() || null,
      legacy_owner_id: (t["ownerId"] || "").trim() || null,
    });
  }

  // Compose the full row set: every printed code + every registered code.
  const allCodes = new Set([...qrByCode.keys(), ...tagByCode.keys()]);
  const rows = [];
  for (const code of allCodes) {
    const q = qrByCode.get(code);
    const o = tagByCode.get(code) || {};
    // Every row carries the SAME full column set with explicit values, so a
    // batched upsert never sends NULL into a NOT-NULL column (claimed/lost_mode).
    rows.push({
      id: code,
      claimed: !!tagByCode.get(code),
      item_name: o.item_name ?? null,
      item_type: o.item_type ?? null,
      owner_name: o.owner_name ?? null,
      email: o.email ?? null,
      phone: o.phone ?? null,
      alt_phone: o.alt_phone ?? null,
      message: o.message ?? null,
      address: o.address ?? null,
      city: o.city ?? null,
      state: o.state ?? null,
      country: o.country ?? null,
      lost_mode: o.lost_mode ?? false,
      status_raw: o.status_raw ?? null,
      pref_contact: o.pref_contact ?? null,
      url_prefix: (q?.["urlPrefix"] || "").trim() || null,
      legacy_owner_id: o.legacy_owner_id ?? null,
    });
  }

  // ---------- report ----------
  const claimed = rows.filter((r) => r.claimed);
  const lost = claimed.filter((r) => r.lost_mode);
  console.log("──────────────────────────────────────────");
  console.log("Legacy import summary");
  console.log("  QR codes (printed):   ", qrByCode.size);
  console.log("  Registered tags:      ", tagByCode.size);
  console.log("  Total rows to upsert: ", rows.length);
  console.log("    · claimed:          ", claimed.length);
  console.log("    · of which LOST:    ", lost.length);
  console.log("    · blank/claimable:  ", rows.length - claimed.length);
  console.log("──────────────────────────────────────────");
  console.log("Sample claimed rows (contact masked):");
  for (const r of claimed.slice(0, 5)) {
    console.log(
      `  ${r.id}  [${r.status_raw}]  ${r.item_name} — ${r.owner_name} — ` +
        `${r.phone ? r.phone.slice(0, 4) + "****" : "no phone"} / ${
          r.email ? r.email.replace(/(.).*(@.*)/, "$1***$2") : "no email"
        }`
    );
  }
  console.log("──────────────────────────────────────────");

  if (DRY) {
    console.log("DRY RUN — no database writes performed.");
    return;
  }

  // ---------- upsert ----------
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env (URL / SERVICE_ROLE_KEY).");
  const db = createClient(url, key, { auth: { persistSession: false } });

  let done = 0;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from("legacy_tags").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`legacy_tags upsert failed at ${i}: ${error.message}`);
    done += chunk.length;
    console.log(`  legacy_tags: ${done}/${rows.length}`);
  }
  console.log(`✔ legacy_tags upserted: ${done}`);

  // ---------- scans (optional) ----------
  if (WITH_SCANS && existsSync(join(CSV_DIR, "st_qr_code_scan_audit_info.csv"))) {
    const scans = load("st_qr_code_scan_audit_info.csv").map((s) => ({
      code: (s["qrCode"] || "").trim(),
      device_info: (s["deviceInfo"] || "").trim() || null,
      ip_address: (s["ipAddress"] || "").trim() || null,
      lat: parseFloat(s["Latitude"]) || null,
      lng: parseFloat(s["Longitude"]) || null,
      scanned_on: compose([s["Year"], s["Quarter"], s["Month"], s["Day"]], " "),
    })).filter((s) => s.code);
    let sdone = 0;
    for (let i = 0; i < scans.length; i += BATCH) {
      const chunk = scans.slice(i, i + BATCH);
      const { error } = await db.from("legacy_scans").insert(chunk);
      if (error) throw new Error(`legacy_scans insert failed at ${i}: ${error.message}`);
      sdone += chunk.length;
    }
    console.log(`✔ legacy_scans inserted: ${sdone}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error("IMPORT FAILED:", e.message);
  process.exit(1);
});
