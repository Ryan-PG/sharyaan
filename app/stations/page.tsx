import type { Metadata } from "next";
import StationsPage from "@/views/StationsPage";
import { toNextMetadata } from "@/services/metadata";
import { buildDefaultMetadata } from "@/services/seo";

export const metadata: Metadata = toNextMetadata(buildDefaultMetadata("/stations"));

export default function Page() {
  return <StationsPage />;
}
