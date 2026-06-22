import type { Metadata } from "next";
import MetroMapPage from "@/views/MetroMapPage";
import { toNextMetadata } from "@/services/metadata";
import { buildDefaultMetadata } from "@/services/seo";

export const metadata: Metadata = toNextMetadata(buildDefaultMetadata("/metro-map"));

export default function Page() {
  return <MetroMapPage />;
}
