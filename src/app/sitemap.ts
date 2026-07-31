import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/content/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    { url: `${siteUrl}/ask`, priority: 0.6 },
    { url: `${siteUrl}/resume`, priority: 0.7 },
    { url: `${siteUrl}/beyond-code`, priority: 0.5 },
    ...projects.map((p) => ({
      url: `${siteUrl}/work/${p.slug}`,
      priority: 0.8,
    })),
  ];
}
