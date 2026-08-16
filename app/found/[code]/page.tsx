import { notFound } from "next/navigation";
import { getAdminClient, type LegacyTag } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function getTag(code: string): Promise<LegacyTag | null> {
  const db = getAdminClient();
  // Codes are case-sensitive; match exactly.
  const { data } = await db
    .from("legacy_tags")
    .select("*")
    .eq("id", code)
    .maybeSingle();
  return (data as LegacyTag) ?? null;
}

function phones(tag: LegacyTag): string[] {
  return [tag.phone, tag.alt_phone].filter(Boolean) as string[];
}

export default async function FoundPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  // Old system accepted exactly 6 alphanumeric chars.
  if (!/^[a-zA-Z0-9]{6}$/.test(code)) notFound();

  const tag = await getTag(code);
  if (!tag) notFound();

  /* ---------- BLANK / never registered ---------- */
  if (!tag.claimed) {
    return (
      <main className="wrap">
        <div className="card">
          <div className="brand"><span className="dot" /> SecureTag</div>
          <span className="badge blank">Not activated</span>
          <h1>This tag isn&apos;t registered yet</h1>
          <p className="sub">
            This SecureTag is genuine but hasn&apos;t been activated by an owner.
            If it&apos;s yours, register it to start protecting your item.
          </p>
          <a className="btn" href="https://securetag.in">Activate at securetag.in</a>
          <div className="foot">
            Questions? <a href="mailto:support@securetag.in">support@securetag.in</a>
          </div>
        </div>
      </main>
    );
  }

  const pref = (tag.pref_contact || "").toUpperCase();
  const showPhone = pref === "" || pref.includes("PHONE");
  const showEmail = pref === "" || pref.includes("EMAIL");
  const phoneList = showPhone ? phones(tag) : [];
  const email = showEmail ? tag.email : null;

  /* ---------- SECURED (owner has NOT flagged it lost) ----------
     Matches the legacy privacy rule: when the item is not in LOST mode,
     we do not expose the owner's contact details — we route through support. */
  if (!tag.lost_mode) {
    return (
      <main className="wrap">
        <div className="card">
          <div className="brand"><span className="dot" /> SecureTag</div>
          <span className="badge secured">Secured</span>
          <div className="item">Item</div>
          <div className="item-name">{tag.item_name || "SecureTag item"}</div>
          <p className="sub">
            This item is registered and secured with its owner. To help return
            it, contact our team and we&apos;ll reach the owner for you.
          </p>
          <a className="btn" href={`mailto:support@securetag.in?subject=${encodeURIComponent(`Found SecureTag item (${code})`)}`}>
            Contact SecureTag support
          </a>
          <div className="foot">support@securetag.in</div>
        </div>
      </main>
    );
  }

  /* ---------- LOST MODE (owner wants to be reached directly) ---------- */
  const mailto =
    email &&
    `mailto:${email}?subject=${encodeURIComponent(
      `SecureTag item found: ${tag.item_name || ""}`.trim()
    )}&body=${encodeURIComponent(
      "Hi, I found your item with a SecureTag. Please reach out so we can arrange a handover. Thank you!"
    )}`;

  return (
    <main className="wrap">
      <div className="card">
        <div className="brand"><span className="dot" /> SecureTag</div>
        <span className="badge lost">Reported lost</span>
        <h1>Please contact the owner</h1>
        <p className="sub">
          You&apos;ve found a lost item protected by SecureTag. The owner is
          hoping to hear from you — please use the details below.
        </p>

        <div className="item">Item</div>
        <div className="item-name">{tag.item_name || "SecureTag item"}</div>

        {phoneList.map((num) => (
          <div className="row" key={num}>
            <span className="label">Call the owner</span>
            <a className="value" href={`tel:${num}`} style={{ color: "var(--brand)", textDecoration: "none" }}>
              {num}
            </a>
          </div>
        ))}

        {email && (
          <div className="row">
            <span className="label">Email the owner</span>
            <a className="value" href={mailto!} style={{ color: "var(--brand)", textDecoration: "none" }}>
              {email}
            </a>
          </div>
        )}

        {phoneList.length === 0 && !email && (
          <p className="sub">
            The owner hasn&apos;t shared direct contact details. Please reach{" "}
            <a href="mailto:support@securetag.in" style={{ color: "var(--brand)" }}>
              support@securetag.in
            </a>{" "}
            and we&apos;ll connect you.
          </p>
        )}

        <div className="foot">
          Powered by SecureTag · <a href="mailto:support@securetag.in">support@securetag.in</a>
        </div>
      </div>
    </main>
  );
}
