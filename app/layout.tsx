import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Noto_Sans_SC, Fraunces } from "next/font/google";
import "./globals.css";
import "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import { THEME_COOKIE_NAME } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

/**
 * Display face for Display/PageTitle/SectionTitle only (DESIGN_TASKS.md
 * Phase 1, option A) — everything else stays on Inter so the display face
 * reads as a deliberate accent, not a wholesale font swap.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: "HanGo — Aprende chino desde cero y úsalo de verdad",
    template: "%s | HanGo",
  },
  description:
    "Aprende chino desde cero, úsalo en situaciones reales y perfecciona tus habilidades con una ruta estructurada y un AI Teacher que se adapta a tu nivel.",
  openGraph: {
    type: "website",
    siteName: "HanGo",
    title: "Empieza desde cero. Lleva tu chino hasta donde quieras.",
    description: "Aprende chino paso a paso y úsalo en situaciones reales.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "HanGo — Empieza desde cero y lleva tu chino hasta donde quieras.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Empieza desde cero. Lleva tu chino hasta donde quieras.",
    description: "Aprende chino paso a paso y úsalo en situaciones reales.",
    images: ["/og.png"],
  },
};

// Sets `data-theme` on <html> before first paint, client-side, from the
// same cookie ThemeToggle writes (2026-09-08 optimization pass). This used
// to be a server-side `cookies()` read in this exact layout - correct, but
// it's a Dynamic API on the ROOT layout, which forces every route in the
// app (including the public marketing homepage, which has no per-user data
// at all) out of static rendering. Moving it to a `beforeInteractive`
// inline script keeps the same no-flash-of-wrong-theme guarantee (this
// strategy is injected into <head> and runs before the page paints - the
// standard next-themes technique) while letting the marketing page be
// served static/cached again. Targets `documentElement` (<html>), never an
// inner wrapper: Radix Dialog/DropdownMenu/Select/Tooltip all portal to
// `document.body`, which only reliably inherits CSS custom properties set
// on a real DOM ancestor - <html> is one, an inner React-tree wrapper is
// not. "system" intentionally sets no attribute - globals.css's
// `prefers-color-scheme` fallback handles it with zero JS either way.
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]*)/);var v=m?decodeURIComponent(m[1]):null;if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSC.variable} ${fraunces.variable}`}
    >
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
