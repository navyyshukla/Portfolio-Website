import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PaletteShim } from "@/components/ui/PaletteShim";
import { DotField } from "@/components/ui/DotField";
import { AskFab } from "@/components/ui/AskFab";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { profile, siteUrl } from "@/content/profile";

/**
 * Three type voices. next/font self-hosts these at build time — no CDN request,
 * no layout shift. Never swap for @fontsource/* or a Google Fonts <link>.
 */
/**
 * Fraunces over Instrument Serif: Instrument is 400-weight only and very high
 * contrast, so headings went thin and weak at card sizes. Fraunces is variable
 * with an optical-size axis, so it holds presence at 1.9rem and stays elegant
 * in the big hero.
 */
const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display-face",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...buildMetadata({ description: profile.positioning, path: "/" }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <DotField />
        <div className="page">
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
        <AskFab />
        {/* Keydown listener only — the palette itself is lazy-loaded. */}
        <PaletteShim />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
      </body>
    </html>
  );
}
