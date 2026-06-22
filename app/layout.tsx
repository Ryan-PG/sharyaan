import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/index.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { toNextMetadata } from "@/services/metadata";
import { buildDefaultMetadata } from "@/services/seo";

export const metadata: Metadata = toNextMetadata(buildDefaultMetadata("/"));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
