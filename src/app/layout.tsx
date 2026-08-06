import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PaletteShim } from "@/components/ui/PaletteShim";
import { DotField } from "@/components/ui/DotField";
import { Assistant } from "@/components/ui/Assistant";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";
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
      // The script below stamps data-theme before React sees the document.
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before first paint. Without it a visitor who chose light gets a
          dark flash on every navigation, because the stored choice is only
          readable on the client and the server cannot know it.

          Deliberately tiny and dependency-free — `next-themes` would cost
          bundle for what is four lines. Absence of the key means "follow the
          OS", which the CSS already handles, so nothing is stamped.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
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
        <Assistant />
        {/* Keydown listener only — the palette itself is lazy-loaded. */}
        <PaletteShim />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {/*
          The one non-essential script on the page, and a deliberate exception
          to the rule that nothing but the site's own code ships to "/" — see
          DECISIONS.md. Cookieless, so no consent banner, and a leaf client
          component so the wrapper stays a server component. It costs about a
          kilobyte; if it ever costs meaningfully more, the budget wins and
          this goes.
        */}
        <Analytics />
      </body>
    </html>
  );
}
