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
import { formatNumber, stationDisplayName } from "@/utils/text";

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
  const lineData = useMemo(() => buildLineCollection(stations), [stations]);
  const routeData = useMemo(() => buildRouteCollection(route), [route]);
  const lineDataRef = useRef(lineData);
  const routeDataRef = useRef(routeData);
  const stationData = useMemo(
    () =>
      buildStationCollection(stations, language, {
        originId,
        destinationId,
        selectedStationId,
      }),
    [destinationId, language, originId, selectedStationId, stations],
  );
  const stationDataRef = useRef(stationData);
  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, stations],
  );
  const clickHandlerRef = useRef(onStationClick);

  useEffect(() => {
    lineDataRef.current = lineData;
  }, [lineData]);

  useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData]);

  useEffect(() => {
    stationDataRef.current = stationData;
  }, [stationData]);

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
      map.addSource("metro-route", {
        type: "geojson",
        data: routeDataRef.current,
      } satisfies GeoJSONSourceSpecification);
      map.addSource("metro-stations", {
        type: "geojson",
        data: stationDataRef.current,
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
        source: "metro-route",
        paint: {
          "line-color": "#ffffff",
          "line-width": 12,
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
        source: "metro-route",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 7,
          "line-opacity": 0.98,
        },
      });
      map.addLayer({
        id: "station-point-halo",
        type: "circle",
        source: "metro-stations",
        paint: {
          "circle-color": "#020617",
          "circle-radius": [
            "case",
            ["any", ["==", ["get", "isOrigin"], true], ["==", ["get", "isDestination"], true]],
            12,
            9,
          ],
          "circle-opacity": 0.32,
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
            ["any", ["==", ["get", "isOrigin"], true], ["==", ["get", "isDestination"], true]],
            10,
            7,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": [
            "case",
            ["any", ["==", ["get", "isOrigin"], true], ["==", ["get", "isDestination"], true]],
            3,
            2,
          ],
          "circle-opacity": 1,
          "circle-stroke-opacity": 1,
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
      if (!feature?.properties) return;

      const stationId = String(feature.properties.id ?? "");
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
  }, [style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSources = () => {
      const lineSource = map.getSource("metro-lines") as GeoJSONSource | undefined;
      lineSource?.setData(lineDataRef.current);
      const routeSource = map.getSource("metro-route") as GeoJSONSource | undefined;
      routeSource?.setData(routeDataRef.current);
      const stationSource = map.getSource("metro-stations") as GeoJSONSource | undefined;
      stationSource?.setData(stationDataRef.current);
    };

    if (map.isStyleLoaded()) {
      updateSources();
      return;
    }

    map.once("load", updateSources);
    return () => {
      map.off("load", updateSources);
    };
  }, [lineData, routeData, stationData]);

  useEffect(() => {
    const map = mapRef.current;
    popupRef.current?.remove();
    popupRef.current = null;

    if (!map || !selectedStation) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "280px",
      offset: 12,
    })
      .setLngLat([selectedStation.longitude, selectedStation.latitude])
      .setHTML(
        `<div class="metro-map-popup"><strong>${escapeHtml(
          stationDisplayName(selectedStation, language),
        )}</strong><span>${escapeHtml(
          `${t("lines")}: ${selectedStation.lines
            .map((line) => formatNumber(line, language))
            .join(", ")}`,
        )}</span></div>`,
      );

    popupRef.current = popup;
    const addPopup = () => {
      if (popupRef.current === popup) popup.addTo(map);
    };

    if (map.isStyleLoaded()) {
      addPopup();
    } else {
      map.once("load", addPopup);
    }

    return () => {
      map.off("load", addPopup);
      popup.remove();
      if (popupRef.current === popup) popupRef.current = null;
    };
  }, [language, selectedStation, t]);

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
        isOrigin: station.id === selection.originId,
        isDestination: station.id === selection.destinationId,
        isSelected: station.id === selection.selectedStationId,
      },
    })),
  };
}

function buildLineCollection(stations: Station[]): GeoJSON.FeatureCollection {
  const byId = new Map(stations.map((station) => [station.id, station]));
  const seen = new Set<string>();
  const features: GeoJSON.Feature[] = [];

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
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function buildRouteCollection(route: RouteResult | null): GeoJSON.FeatureCollection {
  if (!route) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: route.stations.slice(0, -1).map((station, index) => {
      const next = route.stations[index + 1];
      const step = route.steps[index];

      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [station.longitude, station.latitude],
            [next.longitude, next.latitude],
          ],
        },
        properties: {
          color: step?.color ?? station.colors[0] ?? "#2563eb",
        },
      };
    }),
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
