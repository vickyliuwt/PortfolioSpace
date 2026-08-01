// Footer.tsx
// cozy footer (vicky style)

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="stack" style={{ gap: 3 }}>
          <span className="footer-name">🐾 PortfolioSpace</span>
          <span className="footer-tag">A cozy home for creative work — made by Vicky.</span>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/Discover">Discover</Link>
          <Link href="/Account/Signup">Join</Link>
          <Link href="/Account/Profile">Profile</Link>
        </nav>

        <div className="footer-social">
          <a href="https://github.com/vickyliuwt/PortfolioSpace" target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
          <a href="https://github.com/vickyliuwt" target="_blank" rel="noopener noreferrer">
            @vickyliuwt ↗
          </a>
          <ThemeToggle />
        </div>
      </div>

      <div className="footer-base">
        Built with React, Node &amp; 🐾 · © {new Date().getFullYear()} Weiting Liu
      </div>
    </footer>
  );
}
