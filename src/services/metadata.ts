import type { Metadata } from "next";
import type { SeoMetadata } from "@/services/seo";

export function toNextMetadata(metadata: SeoMetadata): Metadata {
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.canonicalUrl,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: metadata.canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: metadata.title,
      description: metadata.description,
    },
  };
}
