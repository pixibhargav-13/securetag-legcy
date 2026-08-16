export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="wrap">
      <div className="card">
        <div className="brand"><span className="dot" /> SecureTag</div>
        <h1>Found something with a SecureTag?</h1>
        <p className="sub">
          Every SecureTag has a unique code. Scan the QR on the tag, or open the
          link printed on it, to reach the item&apos;s owner.
        </p>
        <a className="btn" href="https://securetag.in">Visit securetag.in</a>
        <div className="foot">
          Need help? <a href="mailto:support@securetag.in">support@securetag.in</a>
        </div>
      </div>
    </main>
  );
}
