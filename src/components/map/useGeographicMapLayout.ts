import { useMemo } from "react";
import type { Station, ViewportStation } from "@/types/metro";

export type MapEdge = {
  key: string;
  from: ViewportStation;
  to: ViewportStation;
  color: string;
};

export type MapGridLine = {
  key: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  textX: number;
  textY: number;
};

export type GeographicMapLayout = {
  width: number;
  height: number;
  stations: ViewportStation[];
  edges: MapEdge[];
  longitudeLines: MapGridLine[];
  latitudeLines: MapGridLine[];
  cityAreaPath: string;
  boundsLabel: string;
  center: {
    latitude: number;
    longitude: number;
  };
};

const WIDTH = 1160;
const HEIGHT = 720;
const PADDING = {
  top: 58,
  right: 82,
  bottom: 68,
  left: 82,
};
const MAP_BOUNDS_PADDING_DEGREES = 0.018;
const GRID_LINE_COUNT = 5;

type MercatorPoint = {
  x: number;
  y: number;
};

export function useGeographicMapLayout(stations: Station[]): GeographicMapLayout {
  return useMemo(() => {
    const longitudes = stations.map((station) => station.longitude);
    const latitudes = stations.map((station) => station.latitude);
    const bounds = {
      minLng: Math.min(...longitudes) - MAP_BOUNDS_PADDING_DEGREES,
      maxLng: Math.max(...longitudes) + MAP_BOUNDS_PADDING_DEGREES,
      minLat: Math.min(...latitudes) - MAP_BOUNDS_PADDING_DEGREES,
      maxLat: Math.max(...latitudes) + MAP_BOUNDS_PADDING_DEGREES,
    };

    const topLeft = project(bounds.minLng, bounds.maxLat);
    const bottomRight = project(bounds.maxLng, bounds.minLat);
    const projectedWidth = Math.max(0.0001, bottomRight.x - topLeft.x);
    const projectedHeight = Math.max(0.0001, bottomRight.y - topLeft.y);

    const toViewport = (longitude: number, latitude: number) => {
      const projected = project(longitude, latitude);
      return {
        x: PADDING.left + ((projected.x - topLeft.x) / projectedWidth) * mapWidth(),
        y: PADDING.top + ((projected.y - topLeft.y) / projectedHeight) * mapHeight(),
      };
    };

    const viewportStations = stations.map((station) => ({
      ...station,
      ...toViewport(station.longitude, station.latitude),
    }));

    const stationMap = new Map(viewportStations.map((station) => [station.id, station]));
    const edgeKeys = new Set<string>();
    const edges: MapEdge[] = [];

    for (const station of viewportStations) {
      for (const relationId of station.relations) {
        const relation = stationMap.get(relationId);
        if (!relation) continue;

        const key = [station.id, relation.id].sort().join("__");
        if (edgeKeys.has(key)) continue;
        edgeKeys.add(key);

        const sharedLine = station.lines.find((line) => relation.lines.includes(line));
        const colorIndex = sharedLine ? station.lines.indexOf(sharedLine) : 0;

        edges.push({
          key,
          from: station,
          to: relation,
          color: station.colors[colorIndex] ?? station.colors[0] ?? "#71717a",
        });
      }
    }

    const longitudeLines = makeRange(bounds.minLng, bounds.maxLng, GRID_LINE_COUNT).map(
      (longitude) => {
        const top = toViewport(longitude, bounds.maxLat);
        const bottom = toViewport(longitude, bounds.minLat);
        return {
          key: `lng-${longitude.toFixed(4)}`,
          label: `${longitude.toFixed(2)}E`,
          x1: top.x,
          y1: top.y,
          x2: bottom.x,
          y2: bottom.y,
          textX: bottom.x,
          textY: HEIGHT - 28,
        };
      },
    );

    const latitudeLines = makeRange(bounds.minLat, bounds.maxLat, GRID_LINE_COUNT).map(
      (latitude) => {
        const left = toViewport(bounds.minLng, latitude);
        const right = toViewport(bounds.maxLng, latitude);
        return {
          key: `lat-${latitude.toFixed(4)}`,
          label: `${latitude.toFixed(2)}N`,
          x1: left.x,
          y1: left.y,
          x2: right.x,
          y2: right.y,
          textX: 28,
          textY: left.y + 4,
        };
      },
    );

    return {
      width: WIDTH,
      height: HEIGHT,
      stations: viewportStations,
      edges,
      longitudeLines,
      latitudeLines,
      cityAreaPath: buildCityAreaPath(),
      boundsLabel: `${bounds.minLat.toFixed(2)}N-${bounds.maxLat.toFixed(2)}N, ${bounds.minLng.toFixed(
        2,
      )}E-${bounds.maxLng.toFixed(2)}E`,
      center: {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
      },
    };
  }, [stations]);
}

function project(longitude: number, latitude: number): MercatorPoint {
  const x = (longitude + 180) / 360;
  const latitudeRadians = (clamp(latitude, -85.05112878, 85.05112878) * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2;

  return { x, y };
}

function mapWidth() {
  return WIDTH - PADDING.left - PADDING.right;
}

function mapHeight() {
  return HEIGHT - PADDING.top - PADDING.bottom;
}

function makeRange(min: number, max: number, count: number) {
  if (count <= 1) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

function buildCityAreaPath() {
  const left = PADDING.left + 20;
  const right = WIDTH - PADDING.right - 12;
  const top = PADDING.top + 12;
  const bottom = HEIGHT - PADDING.bottom - 16;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

  return [
    `M ${left + 72} ${top + 54}`,
    `C ${midX - 188} ${top - 18}, ${right - 170} ${top + 10}, ${right - 74} ${top + 92}`,
    `C ${right + 10} ${top + 164}, ${right - 22} ${midY - 44}, ${right - 10} ${midY + 38}`,
    `C ${right + 6} ${bottom - 92}, ${right - 100} ${bottom + 22}, ${midX + 76} ${bottom - 8}`,
    `C ${midX - 52} ${bottom + 28}, ${left + 168} ${bottom - 2}, ${left + 88} ${bottom - 80}`,
    `C ${left + 8} ${bottom - 158}, ${left - 18} ${top + 180}, ${left + 72} ${top + 54}`,
    "Z",
  ].join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
