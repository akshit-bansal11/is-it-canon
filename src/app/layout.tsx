import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { type ReactNode, Suspense } from "react";
import Analytics from "@/components/site/Analytics";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "isitcanon",
  description:
    "Story order for connected franchises — games, movies and series, in in-universe chronology.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="/theme.js" strategy="beforeInteractive" />
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
