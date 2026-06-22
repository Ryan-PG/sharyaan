import type { MetadataRoute } from "next";
import { getStations } from "@/services/metro";
import { buildLineGroups, getSiteUrl, linePath, stationPath } from "@/services/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const stations = getStations();
  const now = new Date();

  return [
    route(baseUrl, "/", now, "daily", 1),
    route(baseUrl, "/stations", now, "weekly", 0.8),
    route(baseUrl, "/metro-map", now, "monthly", 0.7),
    ...stations.map((station) => route(baseUrl, stationPath(station), now, "monthly", 0.6)),
    ...buildLineGroups(stations).map((line) =>
      route(baseUrl, linePath(line.id), now, "monthly", 0.6),
    ),
  ];
}

function route(
  baseUrl: string,
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}
