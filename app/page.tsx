import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <Header />
      <main className="st-main">
        <div className="st-card">
          <span className="st-badge blank"><span className="d" /> SecureTag</span>
          <h1 className="font-display">Found something with a SecureTag?</h1>
          <p className="st-lead">
            Every SecureTag carries a unique code. Scan the QR on the tag, or open the link
            printed on it, to reach the item&apos;s owner.
          </p>
          <a className="st-btn" href="https://securetag.in">Visit securetag.in</a>
          <div className="st-note">Need help? <a href="mailto:support@securetag.in">support@securetag.in</a></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
