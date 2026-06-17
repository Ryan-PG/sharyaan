import { useEffect } from "react";
import type { SeoMetadata } from "@/services/seo";
import { updateDocumentSeo } from "@/services/seo";

export function usePageSeo(metadata: SeoMetadata, jsonLd?: unknown) {
  useEffect(() => {
    updateDocumentSeo(metadata, jsonLd);
  }, [jsonLd, metadata]);
}
