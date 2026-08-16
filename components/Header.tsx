export default function Header() {
  return (
    <header className="st-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="beam" src="/beam.jpg" alt="" aria-hidden="true" />
      <div className="beam-shade" />
      <div className="st-header-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/full-logo.svg" alt="SecureTag" />
        <a className="get" href="https://securetag.in" target="_blank" rel="noopener noreferrer">
          Get yours today
        </a>
      </div>
    </header>
  );
}
