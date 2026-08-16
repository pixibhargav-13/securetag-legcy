import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="st-main">
        <div className="st-card">
          <span className="st-badge blank"><span className="d" /> Unknown tag</span>
          <h1 className="font-display">We couldn&apos;t find that tag</h1>
          <p className="st-lead">
            This code doesn&apos;t match any SecureTag. Please double-check the link printed
            on the tag — codes are 6 characters and case-sensitive.
          </p>
          <a className="st-btn ghost" href="https://securetag.in">Go to securetag.in</a>
          <div className="st-note">Still stuck? <a href="mailto:support@securetag.in">support@securetag.in</a></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
