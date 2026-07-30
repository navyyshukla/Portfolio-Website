import type { Metadata } from "next";
import { profile, siteUrl } from "@/content/profile";

/**
 * The single place metadata is constructed. Pages declare only what varies —
 * never copy title/OG/canonical boilerplate into a page.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description: string;
  path?: string;
}): Metadata {
  const fullTitle = title ? `${title} · ${profile.name}` : profile.name;
  const url = new URL(path, siteUrl).toString();

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: profile.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

/** JSON-LD Person node, injected server-side from the root layout. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.positioning,
    url: siteUrl,
    sameAs: profile.socials.map((s) => s.href),
  };
}
