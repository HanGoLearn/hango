import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Noto_Sans_SC, Fraunces } from "next/font/google";
import "./globals.css";
import "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import { THEME_COOKIE_NAME, isThemePreference } from "@/lib/theme";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const theme = isThemePreference(rawTheme) ? rawTheme : "system";

  return (
    <html
      lang="en"
      // "system" renders no attribute at all - globals.css's
      // `prefers-color-scheme` fallback handles it with zero client JS.
      // This attribute must stay on <html> specifically (never move to an
      // inner wrapper): Radix Dialog/DropdownMenu/Select/Tooltip all portal
      // to `document.body`, which is only guaranteed to inherit CSS custom
      // properties set on an actual DOM ancestor - <html> is one, an inner
      // React-tree wrapper is not (portals escape the React tree, not the
      // real DOM tree, but they still escape any wrapper below <html>).
      {...(theme === "system" ? {} : { "data-theme": theme })}
      className={`${inter.variable} ${notoSansSC.variable} ${fraunces.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
