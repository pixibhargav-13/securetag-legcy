import { notFound, redirect } from "next/navigation";
import { getAdminClient, type LegacyTag } from "@/lib/supabase-admin";
import { getSessionEmail } from "@/lib/supabase-auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanAudit from "@/components/ScanAudit";

export const dynamic = "force-dynamic";

// Where owners manage their items (the main site). Overridable via env.
const MANAGE_ORIGIN = process.env.NEXT_PUBLIC_MANAGE_ORIGIN || "https://securetag.in";

async function getTag(code: string): Promise<LegacyTag | null> {
  const db = getAdminClient();
  const { data, error } = await db.from("legacy_tags").select("*").eq("id", code).maybeSingle();
  // A DB outage must show as an error, not as "this tag doesn't exist".
  if (error) throw new Error(`Could not load tag: ${error.message}`);
  return (data as LegacyTag) ?? null;
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="st-main">{children}</main>
      <Footer />
    </>
  );
}

export default async function FoundPage({ params }: { params: { code: string } }) {
  const code = params.code;
  if (!/^[a-zA-Z0-9]{6}$/.test(code)) notFound();

  const tag = await getTag(code);
  if (!tag) notFound();

  /* ---------- OWNER logged in (scanning their own tag) ----------
     Reproduces the old behaviour: an owner scanning their own tag is sent to
     their manage view on the main site; everyone else sees the finder page.
     Session is shared across .securetag.in, matched by verified email. */
  if (tag.claimed && tag.email) {
    const sessionEmail = await getSessionEmail();
    if (sessionEmail && sessionEmail === tag.email.trim().toLowerCase()) {
      redirect(`${MANAGE_ORIGIN}/dashboard/legacy-item/${code}/edit`);
    }
  }

  /* ---------- BLANK / not activated ----------
     Straight to activation on the main site, which asks the person to log in
     or register and then returns them to the activation form for this code
     (the old app's /activate/<code> step). */
  if (!tag.claimed) redirect(`${MANAGE_ORIGIN}/legacy/activate/${code}`);

  const pref = (tag.pref_contact || "").toUpperCase();
  const showPhone = pref === "" || pref.includes("PHONE");
  const showEmail = pref === "" || pref.includes("EMAIL");
  const phoneList = (showPhone ? [tag.phone, tag.alt_phone] : []).filter(Boolean) as string[];
  const email = showEmail ? tag.email : null;

  /* ---------- SECURED (registered, not in lost mode) ---------- */
  if (!tag.lost_mode) {
    return (
      <Shell>
        <ScanAudit code={code} />
        <div className="st-card">
          <span className="st-badge secured"><span className="d" /> Secured</span>
          <p className="st-item-label">Item</p>
          <div className="st-item-name font-display">{tag.item_name || "SecureTag item"}</div>
          <p className="st-lead">
            This item is registered and secured with its owner. To help return it, contact
            our team and we&apos;ll reach the owner on your behalf.
          </p>
          <a
            className="st-btn"
            href={`mailto:support@securetag.in?subject=${encodeURIComponent(`Found SecureTag item (${code})`)}`}
          >
            Contact SecureTag support
          </a>
          <div className="st-note">support@securetag.in</div>
        </div>
      </Shell>
    );
  }

  /* ---------- LOST MODE — reveal owner contact ---------- */
  const mailto =
    email &&
    `mailto:${email}?subject=${encodeURIComponent(`SecureTag item found: ${tag.item_name || ""}`.trim())}` +
      `&body=${encodeURIComponent("Hi, I found your item with a SecureTag. Please reach out so we can arrange a handover. Thank you!")}`;

  return (
    <Shell>
      <ScanAudit code={code} />
      <div className="st-card">
        <span className="st-badge lost"><span className="d" /> Reported lost</span>
        <h1 className="font-display">Please contact the owner</h1>
        <p className="st-lead">
          You&apos;ve found a lost item protected by SecureTag. The owner is hoping to hear
          from you — please use the details below to reach them.
        </p>

        <p className="st-item-label">Item</p>
        <div className="st-item-name font-display">{tag.item_name || "SecureTag item"}</div>
        {tag.message && <p className="st-lead st-owner-msg">&ldquo;{tag.message}&rdquo;</p>}

        <ul className="st-contact">
          {phoneList.map((num) => (
            <li key={num}>
              <span className="k"><span className="ic"><PhoneIcon /></span> Call the owner</span>
              <a className="v" href={`tel:${num}`}>{num}</a>
            </li>
          ))}
          {email && (
            <li>
              <span className="k"><span className="ic"><MailIcon /></span> Email the owner</span>
              <a className="v" href={mailto!}>{email}</a>
            </li>
          )}
        </ul>

        {phoneList.length === 0 && !email && (
          <p className="st-lead" style={{ marginTop: 16 }}>
            The owner hasn&apos;t shared direct contact details. Please reach{" "}
            <a href="mailto:support@securetag.in" style={{ color: "var(--indigo-600)" }}>support@securetag.in</a>{" "}
            and we&apos;ll connect you.
          </p>
        )}

        <div className="st-note">Powered by SecureTag · <a href="mailto:support@securetag.in">support@securetag.in</a></div>
      </div>
    </Shell>
  );
}
