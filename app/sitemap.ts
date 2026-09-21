import type { MetadataRoute } from "next";
import { GRADE_IDS, SKILLS } from "@/lib/curriculum";
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
    {
      url: `${siteUrl}/grades`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...GRADE_IDS.map((grade) => ({
      url: `${siteUrl}/grades/${grade}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...SKILLS.map((skill) => ({
      url: `${siteUrl}/skills/${skill.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      lastModified: new Date(tool.publishedOn),
      changeFrequency: "weekly" as const,
      priority: tool.status === "live" ? 0.9 : 0.4,
    })),
  ];
}
