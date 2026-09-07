import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { tools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...tools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      lastModified: new Date(tool.publishedOn),
      changeFrequency: "weekly" as const,
      priority: tool.status === "live" ? 0.9 : 0.4,
    })),
  ];
}
