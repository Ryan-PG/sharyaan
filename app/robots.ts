import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/services/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
