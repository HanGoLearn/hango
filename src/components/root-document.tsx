import type { ReactNode } from "react";
import { Fraunces, Inter, Noto_Sans_SC } from "next/font/google";
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

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]*)/);var v=m?decodeURIComponent(m[1]):null;if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v);}}catch(e){}})();`;

export function RootDocument({
  children,
  lang,
}: {
  children: ReactNode;
  lang: "es" | "en";
}) {
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${notoSansSC.variable} ${fraunces.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
