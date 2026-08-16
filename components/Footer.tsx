export default function Footer() {
  return (
    <footer className="st-footer">
      <div className="st-footer-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/full-logo.svg" alt="SecureTag" />
        <nav>
          <a href="https://securetag.in/terms-and-conditions">Terms and Conditions</a>
          <a href="https://securetag.in/privacy-policy">Privacy Policy</a>
          <a href="https://securetag.in/return-policy">Return &amp; Refund Policy</a>
          <a href="https://securetag.in/shipping-policy">Shipping Policy</a>
        </nav>
        <div className="copy">
          © Copyright 2024. All rights reserved. <strong>SecureTag.</strong>
        </div>
      </div>
    </footer>
  );
}
