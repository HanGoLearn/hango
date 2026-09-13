import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import "@/lib/env/server";
import {
  RootDocument,
  THEME_INIT_SCRIPT,
} from "@/components/root-document";

export const metadata: Metadata = {
  title: {
    default: "Administración | HanGo",
    template: "%s | HanGo",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RootDocument lang="es">
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
      {children}
    </RootDocument>
  );
}
