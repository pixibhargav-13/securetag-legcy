export default function NotFound() {
  return (
    <main className="wrap">
      <div className="card">
        <div className="brand"><span className="dot" /> SecureTag</div>
        <span className="badge blank">Unknown tag</span>
        <h1>We couldn&apos;t find that tag</h1>
        <p className="sub">
          This code doesn&apos;t match any SecureTag. Please double-check the
          link printed on the tag — codes are 6 characters and case-sensitive.
        </p>
        <a className="btn ghost" href="https://securetag.in">Go to securetag.in</a>
        <div className="foot">
          Still stuck? <a href="mailto:support@securetag.in">support@securetag.in</a>
        </div>
      </div>
    </main>
  );
}
