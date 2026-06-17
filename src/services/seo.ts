import type { Station } from "@/types/metro";
import { compareStationPersianNames } from "@/utils/text";

export const SITE_NAME_FA = "مسیریاب مترو تهران";
export const DEFAULT_BASE_URL = "https://tehran-metro-navigator.local";

export type MetroLine = {
  id: number;
  name: string;
  color: string;
  stations: Station[];
};

export type StationNeighbors = {
  nearby: Station[];
  previous: Station[];
  next: Station[];
};

export type SeoMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
};

export function getSiteUrl() {
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  return normalizeBaseUrl(envUrl || DEFAULT_BASE_URL);
}

export function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function stationSlug(station: Pick<Station, "id" | "name">) {
  return slugify(station.id || station.name);
}

export function linePath(lineId: number) {
  return `/lines/${lineId}`;
}

export function stationPath(station: Pick<Station, "id" | "name">) {
  return `/stations/${stationSlug(station)}`;
}

export function findStationBySlug(stations: Station[], slug = "") {
  return stations.find((station) => stationSlug(station) === slug) ?? null;
}

export function buildLineGroups(stations: Station[]): MetroLine[] {
  const groups = new Map<number, MetroLine>();

  for (const station of stations) {
    station.lines.forEach((line, index) => {
      const color = station.colors[index] ?? station.colors[0] ?? "#71717a";
      const existing = groups.get(line);

      if (existing) {
        existing.stations.push(station);
        return;
      }

      groups.set(line, {
        id: line,
        name: `خط ${line}`,
        color,
        stations: [station],
      });
    });
  }

  return [...groups.values()]
    .map((line) => ({
      ...line,
      stations: orderStationsForLine(line.stations, line.id),
    }))
    .sort((a, b) => a.id - b.id);
}

export function getLineById(stations: Station[], lineId: number) {
  return buildLineGroups(stations).find((line) => line.id === lineId) ?? null;
}

export function getStationNeighbors(station: Station, stations: Station[]): StationNeighbors {
  const stationById = new Map(stations.map((item) => [item.id, item]));
  const nearby = getRelatedStationIds(station, stations)
    .map((id) => stationById.get(id))
    .filter((item): item is Station => Boolean(item))
    .sort(compareStationPersianNames);

  const previous: Station[] = [];
  const next: Station[] = [];

  for (const lineId of station.lines) {
    const lineStations = orderStationsForLine(
      stations.filter((item) => item.lines.includes(lineId)),
      lineId,
    );
    const index = lineStations.findIndex((item) => item.id === station.id);

    if (index > 0) previous.push(lineStations[index - 1]);
    if (index >= 0 && index < lineStations.length - 1) next.push(lineStations[index + 1]);
  }

  return {
    nearby: dedupeStations(nearby),
    previous: dedupeStations(previous),
    next: dedupeStations(next),
  };
}

export function buildStationMetadata(station: Station, baseUrl = getSiteUrl()): SeoMetadata {
  const title = `ایستگاه مترو ${station.nameFa || station.name} | ${SITE_NAME_FA}`;
  const description = `اطلاعات کامل ایستگاه مترو ${station.nameFa || station.name} خطوط ایستگاههای مجاور و مسیرهای دسترسی`;

  return {
    title,
    description,
    canonicalUrl: `${baseUrl}${stationPath(station)}`,
  };
}

export function buildLineMetadata(line: MetroLine, baseUrl = getSiteUrl()): SeoMetadata {
  return {
    title: `${line.name} مترو تهران | ${SITE_NAME_FA}`,
    description: `فهرست ایستگاههای ${line.name} مترو تهران به ترتیب مسیر همراه با لینک اطلاعات هر ایستگاه`,
    canonicalUrl: `${baseUrl}${linePath(line.id)}`,
  };
}

export function buildDefaultMetadata(path = "/", baseUrl = getSiteUrl()): SeoMetadata {
  return {
    title: `${SITE_NAME_FA} | Tehran Metro Navigator`,
    description:
      "مسیریاب مترو تهران با نقشه آفلاین، فهرست ایستگاهها، خطوط مترو و راهنمای مسیر",
    canonicalUrl: `${baseUrl}${path}`,
  };
}

export function buildStationJsonLd(station: Station, stations: Station[], baseUrl = getSiteUrl()) {
  const metadata = buildStationMetadata(station, baseUrl);
  const neighbors = getStationNeighbors(station, stations);

  return {
    "@context": "https://schema.org",
    "@type": ["Place", "TrainStation"],
    name: `ایستگاه مترو ${station.nameFa || station.name}`,
    alternateName: station.name,
    url: metadata.canonicalUrl,
    address: station.address || undefined,
    geo: {
      "@type": "GeoCoordinates",
      latitude: station.latitude,
      longitude: station.longitude,
    },
    publicTransportAccess: true,
    branchCode: station.lines.map((line) => `Line ${line}`).join(", "),
    containedInPlace: {
      "@type": "City",
      name: "Tehran",
    },
    isRelatedTo: neighbors.nearby.map((nearbyStation) => ({
      "@type": "TrainStation",
      name: nearbyStation.nameFa || nearbyStation.name,
      url: `${baseUrl}${stationPath(nearbyStation)}`,
    })),
  };
}

export function buildLineJsonLd(line: MetroLine, baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${line.name} مترو تهران`,
    url: `${baseUrl}${linePath(line.id)}`,
    itemListElement: line.stations.map((station, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: station.nameFa || station.name,
      url: `${baseUrl}${stationPath(station)}`,
    })),
  };
}

export function updateDocumentSeo(metadata: SeoMetadata, jsonLd?: unknown) {
  if (typeof document === "undefined") return;

  document.title = metadata.title;
  setMeta("name", "title", metadata.title);
  setMeta("name", "description", metadata.description);
  setMeta("property", "og:title", metadata.title);
  setMeta("property", "og:description", metadata.description);
  setMeta("property", "og:url", metadata.canonicalUrl);
  setMeta("property", "og:type", "website");
  setMeta("name", "twitter:card", "summary");
  setMeta("name", "twitter:title", metadata.title);
  setMeta("name", "twitter:description", metadata.description);
  setCanonical(metadata.canonicalUrl);
  setJsonLd(jsonLd);
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.content = content;
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.append(element);
  }

  element.href = href;
}

function setJsonLd(value?: unknown) {
  const id = "page-json-ld";
  const existing = document.getElementById(id);

  if (!value) {
    existing?.remove();
    return;
  }

  const element = existing ?? document.createElement("script");
  element.id = id;
  element.setAttribute("type", "application/ld+json");
  element.textContent = JSON.stringify(value);

  if (!existing) document.head.append(element);
}

function slugify(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bgheytariyeh\b/g, "qeytarieh")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized;
}

function orderStationsForLine(stations: Station[], lineId: number) {
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const lineNeighborIds = (station: Station) =>
    getRelatedStationIds(station, stations).filter((relationId) => {
      const relation = stationById.get(relationId);
      return relation?.lines.includes(lineId);
    });

  const endpoints = stations
    .filter((station) => lineNeighborIds(station).length <= 1)
    .sort(compareStationPersianNames);
  const start = endpoints[0] ?? [...stations].sort(compareStationPersianNames)[0];

  if (!start) return [];

  const ordered: Station[] = [];
  const visited = new Set<string>();
  let current: Station | undefined = start;
  let previousId: string | null = null;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);

    const nextId: string | undefined = lineNeighborIds(current)
      .filter((id) => id !== previousId && !visited.has(id))
      .sort((a, b) => {
        const stationA = stationById.get(a);
        const stationB = stationById.get(b);
        if (!stationA || !stationB) return a.localeCompare(b);
        return compareStationPersianNames(stationA, stationB);
      })[0];

    previousId = current.id;
    current = nextId ? stationById.get(nextId) : undefined;
  }

  const missed = stations
    .filter((station) => !visited.has(station.id))
    .sort(compareStationPersianNames);

  return [...ordered, ...missed];
}

function dedupeStations(stations: Station[]) {
  const seen = new Set<string>();
  return stations.filter((station) => {
    if (seen.has(station.id)) return false;
    seen.add(station.id);
    return true;
  });
}

function getRelatedStationIds(station: Station, stations: Station[]) {
  const ids = new Set(station.relations.filter((id) => id !== station.id));

  for (const candidate of stations) {
    if (candidate.id !== station.id && candidate.relations.includes(station.id)) {
      ids.add(candidate.id);
    }
  }

  return [...ids];
}
