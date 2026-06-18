import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const stationsFile = path.join(rootDir, "src", "data", "stations.json");
const baseUrl = normalizeBaseUrl(
  process.env.VITE_SITE_URL || "https://tehran-metro-navigator.local",
);
const siteNameFa = "مسیریاب مترو تهران";

const rawStations = JSON.parse(await fs.readFile(stationsFile, "utf8"));
const stations = normalizeStations(rawStations);
const lines = buildLineGroups(stations);
const baseHtml = await fs.readFile(path.join(distDir, "index.html"), "utf8");

const routes = [
  {
    path: "/",
    metadata: buildDefaultMetadata("/"),
    body: renderHomeFallback(stations, lines),
  },
  {
    path: "/metro-map",
    metadata: buildDefaultMetadata("/metro-map"),
    body: renderMetroMapFallback(),
  },
  {
    path: "/stations",
    metadata: buildDefaultMetadata("/stations"),
    body: renderStationsFallback(lines),
  },
  ...stations.map((station) => ({
    path: stationPath(station),
    metadata: buildStationMetadata(station),
    jsonLd: buildStationJsonLd(station),
    body: renderStationFallback(station),
  })),
  ...lines.map((line) => ({
    path: linePath(line.id),
    metadata: buildLineMetadata(line),
    jsonLd: buildLineJsonLd(line),
    body: renderLineFallback(line),
  })),
];

for (const route of routes) {
  await writeRouteHtml(route.path, renderHtml(route));
}

await fs.writeFile(path.join(distDir, "sitemap.xml"), renderSitemap(routes), "utf8");
await fs.writeFile(path.join(distDir, "robots.txt"), renderRobots(), "utf8");

console.log(
  `Generated SEO pages for ${stations.length} stations, ${lines.length} lines, sitemap.xml, and robots.txt.`,
);

function normalizeStations(data) {
  return Object.entries(data)
    .map(([id, station]) => ({
      id,
      name: station.name || id,
      nameFa: repairMojibake(station.translations?.fa) || station.name || id,
      lines: station.lines.map(Number).filter(Number.isFinite),
      longitude: Number(station.longitude),
      latitude: Number(station.latitude),
      colors: station.colors?.length ? station.colors : ["#71717a"],
      relations: station.relations ?? [],
      disabled: Boolean(station.disabled),
      address: repairMojibake(station.address) || "",
    }))
    .filter((station) => Number.isFinite(station.latitude) && Number.isFinite(station.longitude))
    .sort(compareStationPersianNames);
}

function repairMojibake(value = "") {
  if (!value) return "";
  if (!/[ØÙÛÚ]/.test(value)) return value;

  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function buildLineGroups(allStations) {
  const groups = new Map();

  for (const station of allStations) {
    station.lines.forEach((line, index) => {
      const color = station.colors[index] ?? station.colors[0] ?? "#71717a";
      const existing = groups.get(line);

      if (existing) {
        existing.stations.push(station);
      } else {
        groups.set(line, {
          id: line,
          name: `خط ${line}`,
          color,
          stations: [station],
        });
      }
    });
  }

  return [...groups.values()]
    .map((line) => ({
      ...line,
      stations: orderStationsForLine(line.stations, line.id),
    }))
    .sort((a, b) => a.id - b.id);
}

function getStationNeighbors(station) {
  const stationById = new Map(stations.map((item) => [item.id, item]));
  const nearby = getRelatedStationIds(station, stations)
    .map((id) => stationById.get(id))
    .filter(Boolean)
    .sort(compareStationPersianNames);
  const previous = [];
  const next = [];

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

function buildDefaultMetadata(routePath) {
  return {
    title: `${siteNameFa} | Tehran Metro Navigator`,
    description:
      "مسیریاب مترو تهران با نقشه آفلاین، فهرست ایستگاهها، خطوط مترو و راهنمای مسیر",
    canonicalUrl: `${baseUrl}${routePath}`,
  };
}

function buildStationMetadata(station) {
  const title = `ایستگاه مترو ${station.nameFa || station.name} | ${siteNameFa}`;

  return {
    title,
    description: `اطلاعات کامل ایستگاه مترو ${station.nameFa || station.name} خطوط ایستگاههای مجاور و مسیرهای دسترسی`,
    canonicalUrl: `${baseUrl}${stationPath(station)}`,
  };
}

function buildLineMetadata(line) {
  return {
    title: `${line.name} مترو تهران | ${siteNameFa}`,
    description: `فهرست ایستگاههای ${line.name} مترو تهران به ترتیب مسیر همراه با لینک اطلاعات هر ایستگاه`,
    canonicalUrl: `${baseUrl}${linePath(line.id)}`,
  };
}

function buildStationJsonLd(station) {
  const neighbors = getStationNeighbors(station);

  return {
    "@context": "https://schema.org",
    "@type": ["Place", "TrainStation"],
    name: `ایستگاه مترو ${station.nameFa || station.name}`,
    alternateName: station.name,
    url: `${baseUrl}${stationPath(station)}`,
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

function buildLineJsonLd(line) {
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

function renderHtml({ metadata, jsonLd, body }) {
  let html = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:name|property)="(?:title|description|og:title|og:description|og:url|og:type|twitter:card|twitter:title|twitter:description)"[\s\S]*?>/gi, "")
    .replace(/<link\s+rel="canonical"[\s\S]*?>/gi, "")
    .replace(/<script[^>]*id="page-json-ld"[\s\S]*?<\/script>/gi, "");

  const head = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(metadata.canonicalUrl)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`,
  ];

  if (jsonLd) {
    head.push(
      `<script id="page-json-ld" type="application/ld+json">${escapeScriptJson(jsonLd)}</script>`,
    );
  }

  html = html.replace("</head>", `  ${head.join("\n    ")}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">\n${body}\n    </div>`);
}

async function writeRouteHtml(routePath, html) {
  const filePath =
    routePath === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, routePath.replace(/^\/+/, ""), "index.html");

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html, "utf8");
}

function renderHomeFallback() {
  return `<main dir="rtl" lang="fa" class="mx-auto w-full max-w-7xl space-y-4 px-4 py-8">
      <h1>مسیریاب مترو تهران</h1>
      <p>مسیریاب مترو تهران با نقشه آفلاین، فهرست ایستگاهها و صفحات اختصاصی خطوط مترو.</p>
      <nav>
        <a href="/stations">فهرست ایستگاهها</a>
        <a href="/metro-map">نقشه مترو</a>
        ${lines.map((line) => `<a href="${linePath(line.id)}">${escapeHtml(line.name)}</a>`).join(" ")}
      </nav>
    </main>`;
}

function renderMetroMapFallback() {
  return `<main dir="rtl" lang="fa" class="mx-auto w-full max-w-7xl space-y-4 px-4 py-8">
      <h1>نقشه متروی تهران</h1>
      <p>نمای کلی نقشه مترو و دسترسی به فهرست خطوط و ایستگاههای مترو تهران.</p>
      <a href="/stations">مشاهده فهرست ایستگاهها</a>
    </main>`;
}

function renderStationsFallback(allLines) {
  return `<main dir="rtl" lang="fa" class="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <h1>ایستگاههای مترو تهران</h1>
      ${allLines
        .map(
          (line) => `<section>
        <h2><a href="${linePath(line.id)}">${escapeHtml(line.name)} مترو تهران</a></h2>
        <ul>
          ${line.stations
            .map(
              (station) =>
                `<li><a href="${stationPath(station)}">${escapeHtml(station.nameFa || station.name)}</a></li>`,
            )
            .join("")}
        </ul>
      </section>`,
        )
        .join("")}
    </main>`;
}

function renderStationFallback(station) {
  const neighbors = getStationNeighbors(station);
  const related = dedupeStations([
    ...neighbors.previous,
    ...neighbors.next,
    ...neighbors.nearby,
  ]);

  return `<main dir="rtl" lang="fa" class="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <article>
        <h1>ایستگاه مترو ${escapeHtml(station.nameFa || station.name)}</h1>
        <p>${escapeHtml(station.name)} - ${escapeHtml(station.address || "نشانی نامشخص")}</p>
        <dl>
          <dt>خط مترو</dt>
          <dd>${station.lines.map((line) => `<a href="${linePath(line)}">خط ${line}</a>`).join("، ")}</dd>
          <dt>مختصات</dt>
          <dd>${station.latitude}, ${station.longitude}</dd>
          <dt>وضعیت</dt>
          <dd>${station.disabled ? "غیرفعال" : "فعال"}</dd>
        </dl>
      </article>
      <section>
        <h2>پیشنمایش نقشه</h2>
        <p>موقعیت ایستگاه ${escapeHtml(station.nameFa || station.name)} در عرض ${station.latitude} و طول ${station.longitude}.</p>
      </section>
      <section>
        <h2>ایستگاههای مرتبط</h2>
        <ul>
          ${related
            .map(
              (relatedStation) =>
                `<li><a href="${stationPath(relatedStation)}">${escapeHtml(relatedStation.nameFa || relatedStation.name)}</a></li>`,
            )
            .join("")}
        </ul>
      </section>
    </main>`;
}

function renderLineFallback(line) {
  return `<main dir="rtl" lang="fa" class="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <h1>${escapeHtml(line.name)} مترو تهران</h1>
      <p>رنگ خط: ${escapeHtml(line.color)}. فهرست ایستگاههای خط به ترتیب مسیر.</p>
      <ol>
        ${line.stations
          .map(
            (station) =>
              `<li><a href="${stationPath(station)}">${escapeHtml(station.nameFa || station.name)}</a></li>`,
          )
          .join("")}
      </ol>
    </main>`;
}

function renderSitemap(allRoutes) {
  const today = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function stationPath(station) {
  return `/stations/${slugify(station.id || station.name)}`;
}

function linePath(lineId) {
  return `/lines/${lineId}`;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bgheytariyeh\b/g, "qeytarieh")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function orderStationsForLine(lineStations, lineId) {
  const stationById = new Map(lineStations.map((station) => [station.id, station]));
  const lineNeighborIds = (station) =>
    getRelatedStationIds(station, lineStations).filter((relationId) => {
      const relation = stationById.get(relationId);
      return relation?.lines.includes(lineId);
    });
  const endpoints = lineStations
    .filter((station) => lineNeighborIds(station).length <= 1)
    .sort(compareStationPersianNames);
  const start = endpoints[0] ?? [...lineStations].sort(compareStationPersianNames)[0];

  if (!start) return [];

  const ordered = [];
  const visited = new Set();
  let current = start;
  let previousId = null;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);

    const nextId = lineNeighborIds(current)
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

  const missed = lineStations
    .filter((station) => !visited.has(station.id))
    .sort(compareStationPersianNames);

  return [...ordered, ...missed];
}

function getRelatedStationIds(station, scopeStations) {
  const ids = new Set(station.relations.filter((id) => id !== station.id));

  for (const candidate of scopeStations) {
    if (candidate.id !== station.id && candidate.relations.includes(station.id)) {
      ids.add(candidate.id);
    }
  }

  return [...ids];
}

function dedupeStations(items) {
  const seen = new Set();
  return items.filter((station) => {
    if (seen.has(station.id)) return false;
    seen.add(station.id);
    return true;
  });
}

function compareStationPersianNames(a, b) {
  return (a.nameFa || a.name).localeCompare(b.nameFa || b.name, "fa-IR", {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
