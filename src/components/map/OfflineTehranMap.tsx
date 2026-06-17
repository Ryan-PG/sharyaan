import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl, {
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type StyleSpecification,
} from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Language, RouteResult, Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type OfflineTehranMapProps = {
  stations: Station[];
  language: Language;
  originId?: string | null;
  destinationId?: string | null;
  selectedStationId?: string | null;
  route?: RouteResult | null;
  onStationClick?: (stationId: string) => void;
};

const TEHRAN_BOUNDS: [[number, number], [number, number]] = [
  [50.87, 35.383],
  [51.648, 35.917],
];
const INITIAL_CENTER: [number, number] = [51.389, 35.6892];
const INITIAL_ZOOM = 11.1;

export function OfflineTehranMap({
  stations,
  language,
  originId = null,
  destinationId = null,
  selectedStationId = null,
  route = null,
  onStationClick,
}: OfflineTehranMapProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const style = useMemo(() => buildStyle(), []);
  const lineData = useMemo(() => buildLineCollection(stations, route), [route, stations]);
  const lineDataRef = useRef(lineData);
  const stationData = useMemo(
    () =>
      buildStationCollection(stations, language, {
        originId,
        destinationId,
        selectedStationId,
        routeStationIds: new Set(route?.stations.map((station) => station.id) ?? []),
      }),
    [destinationId, language, originId, route?.stations, selectedStationId, stations],
  );
  const clickHandlerRef = useRef(onStationClick);

  useEffect(() => {
    lineDataRef.current = lineData;
  }, [lineData]);

  useEffect(() => {
    clickHandlerRef.current = onStationClick;
  }, [onStationClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: 18,
      minZoom: 8,
      maxBounds: TEHRAN_BOUNDS,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "OpenMapTiles, OpenStreetMap contributors",
      }),
      "bottom-right",
    );

    map.on("load", () => {
      map.addSource("metro-lines", {
        type: "geojson",
        data: lineDataRef.current,
      } satisfies GeoJSONSourceSpecification);
      map.addSource("metro-stations", {
        type: "geojson",
        data: stationData,
      } satisfies GeoJSONSourceSpecification);

      map.addLayer({
        id: "metro-lines-shadow",
        type: "line",
        source: "metro-lines",
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 5, 15, 9],
          "line-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "metro-route-shadow",
        type: "line",
        source: "metro-lines",
        filter: ["==", ["get", "route"], true],
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 8, 15, 13],
          "line-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "metro-lines",
        type: "line",
        source: "metro-lines",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.5, 15, 5.5],
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "metro-route",
        type: "line",
        source: "metro-lines",
        filter: ["==", ["get", "route"], true],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4.5, 15, 8],
          "line-opacity": 0.98,
        },
      });
      map.addLayer({
        id: "station-points",
        type: "circle",
        source: "metro-stations",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "case",
            ["==", ["get", "selected"], true],
            ["interpolate", ["linear"], ["zoom"], 9, 6, 14, 10, 18, 14],
            ["interpolate", ["linear"], ["zoom"], 9, 4, 14, 7, 18, 10],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": [
            "case",
            ["==", ["get", "selected"], true],
            3,
            2,
          ],
          "circle-opacity": 0.96,
        },
      });
    });

    map.on("mouseenter", "station-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "station-points", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("click", "station-points", (event) => {
      const feature = event.features?.[0];
      if (!feature?.properties || !event.lngLat) return;

      const stationId = String(feature.properties.id ?? "");
      const label = String(feature.properties.label ?? "");
      const lines = String(feature.properties.lines ?? "");
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "280px" })
        .setLngLat(event.lngLat)
        .setHTML(
          `<div class="metro-map-popup"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(
            lines,
          )}</span></div>`,
        )
        .addTo(map);

      if (stationId) {
        clickHandlerRef.current?.(stationId);
      }
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [stationData, style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const lineSource = map.getSource("metro-lines") as GeoJSONSource | undefined;
    lineSource?.setData(lineData);
    const stationSource = map.getSource("metro-stations") as GeoJSONSource | undefined;
    stationSource?.setData(stationData);
  }, [lineData, stationData]);

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold">{t("offlineStreetMap")}</h2>
          <p className="text-sm text-muted-foreground">{t("offlineStreetMapHint")}</p>
        </div>
        <Button
          variant="secondary"
          className="min-h-9 px-3"
          onClick={() =>
            mapRef.current?.easeTo({
              center: INITIAL_CENTER,
              zoom: INITIAL_ZOOM,
              duration: 240,
            })
          }
        >
          <Maximize2 className="size-4" aria-hidden />
          {t("resetMap")}
        </Button>
      </div>
      <div ref={containerRef} className="h-[68vh] min-h-[520px] w-full sm:h-[720px]" />
    </section>
  );
}

function buildStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      openmaptiles: {
        type: "vector",
        tiles: [`${window.location.origin}/maps/tehran/{z}/{x}/{y}.pbf`],
        minzoom: 0,
        maxzoom: 14,
        bounds: [50.87, 35.383, 51.648, 35.917],
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#f8fafc" } },
      {
        id: "landcover-park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["grass", "wood"]]],
        paint: { "fill-color": "#dcefd6", "fill-opacity": 0.7 },
      },
      {
        id: "landuse-park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        paint: { "fill-color": "#d7edcf", "fill-opacity": 0.85 },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": "#b8ddf3" },
      },
      {
        id: "waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        paint: { "line-color": "#8ecae6", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 14, 1.6] },
      },
      {
        id: "buildings",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: { "fill-color": "#e5e7eb", "fill-opacity": 0.65 },
      },
      {
        id: "roads-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track", "path"]]],
        minzoom: 12,
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 15, 2.4],
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]]],
        paint: {
          "line-color": "#fff7ed",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.1, 14, 5.8],
          "line-opacity": 0.95,
        },
      },
      {
        id: "roads-major-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]]],
        paint: {
          "line-color": "#fed7aa",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.8, 14, 7.2],
          "line-opacity": 0.42,
        },
      },
      {
        id: "rail",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["==", ["get", "class"], "rail"],
        paint: {
          "line-color": "#64748b",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 14, 2.4],
          "line-dasharray": [2, 2],
        },
      },
    ],
  };
}

function buildStationCollection(
  stations: Station[],
  language: Language,
  selection: {
    originId: string | null;
    destinationId: string | null;
    selectedStationId: string | null;
    routeStationIds: Set<string>;
  },
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      id: station.id,
      geometry: {
        type: "Point",
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        id: station.id,
        label: stationDisplayName(station, language),
        lines: station.lines.join(", "),
        color:
          station.id === selection.originId
            ? "#16a34a"
            : station.id === selection.destinationId
              ? "#dc2626"
              : station.colors[0] ?? "#71717a",
        selected:
          station.id === selection.originId ||
          station.id === selection.destinationId ||
          station.id === selection.selectedStationId ||
          selection.routeStationIds.has(station.id),
      },
    })),
  };
}

function buildLineCollection(stations: Station[], route: RouteResult | null): GeoJSON.FeatureCollection {
  const byId = new Map(stations.map((station) => [station.id, station]));
  const seen = new Set<string>();
  const routeEdges = new Set<string>();
  const features: GeoJSON.Feature[] = [];

  route?.stations.forEach((station, index) => {
    const next = route.stations[index + 1];
    if (next) routeEdges.add([station.id, next.id].sort().join("__"));
  });

  for (const station of stations) {
    for (const relationId of station.relations) {
      const relation = byId.get(relationId);
      if (!relation) continue;
      const key = [station.id, relation.id].sort().join("__");
      if (seen.has(key)) continue;
      seen.add(key);
      const sharedLine = station.lines.find((line) => relation.lines.includes(line));
      const colorIndex = sharedLine ? station.lines.indexOf(sharedLine) : 0;

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [station.longitude, station.latitude],
            [relation.longitude, relation.latitude],
          ],
        },
        properties: {
          color: station.colors[colorIndex] ?? station.colors[0] ?? "#71717a",
          route: routeEdges.has(key),
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
