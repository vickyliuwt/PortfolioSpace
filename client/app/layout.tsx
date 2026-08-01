// layout.tsx
// app shell

import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, Caveat } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Decor from "./components/Decor";

// fonts
const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-body" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-accent" });

export const metadata: Metadata = {
  title: "PortfolioSpace — a cozy home for creative work 🐾",
  description:
    "PortfolioSpace lets creators save, show and discover animation, illustration, motion and design work. Built with React, Node, MongoDB and S3.",
  icons: { icon: "/favicon.svg" },
};

// pink browser chrome (same as vicky's site)
export const viewport: Viewport = {
  themeColor: "#f6ccd4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${baloo.variable} ${nunito.variable} ${caveat.variable}`}>
        {/* set theme before paint so there's no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('ps-theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();",
          }}
        />
        <Providers>
          <Decor />
          <NavBar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
