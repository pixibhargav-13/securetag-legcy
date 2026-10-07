"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* Shown when the tag can't be loaded (e.g. the database is unreachable) —
   tells the finder to retry instead of claiming the tag doesn't exist. */
export default function Error({ reset }: { reset: () => void }) {
  return (
    <>
      <Header />
      <main className="st-main">
        <div className="st-card">
          <span className="st-badge blank"><span className="d" /> Temporarily unavailable</span>
          <h1 className="font-display">We couldn&apos;t load this tag right now</h1>
          <p className="st-lead">
            Something went wrong on our side. Please try again in a minute. If you found an item,
            you can also write to us and we&apos;ll reach the owner.
          </p>
          <button className="st-btn" onClick={reset}>Try again</button>
          <div className="st-note"><a href="mailto:support@securetag.in">support@securetag.in</a></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
