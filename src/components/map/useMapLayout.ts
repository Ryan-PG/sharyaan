import { useMemo } from "react";
import type { Station, ViewportStation } from "@/types/metro";

export type MapEdge = {
  key: string;
  from: ViewportStation;
  to: ViewportStation;
  color: string;
};

export type MapLayout = {
  width: number;
  height: number;
  stations: ViewportStation[];
  edges: MapEdge[];
  stationMap: Map<string, ViewportStation>;
  boundaryPath: string;
};

const WIDTH = 1080;
const HEIGHT = 760;
const PADDING_X = 74;
const PADDING_Y = 60;

export function useMapLayout(stations: Station[]): MapLayout {
  return useMemo(() => {
    const longitudes = stations.map((station) => station.longitude);
    const latitudes = stations.map((station) => station.latitude);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const lngRange = Math.max(0.0001, maxLng - minLng);
    const latRange = Math.max(0.0001, maxLat - minLat);

    const viewportStations = stations.map((station) => ({
      ...station,
      x: PADDING_X + ((station.longitude - minLng) / lngRange) * (WIDTH - PADDING_X * 2),
      y: PADDING_Y + ((maxLat - station.latitude) / latRange) * (HEIGHT - PADDING_Y * 2),
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

    return {
      width: WIDTH,
      height: HEIGHT,
      stations: viewportStations,
      edges,
      stationMap,
      boundaryPath: buildBoundaryPath(viewportStations),
    };
  }, [stations]);
}

function buildBoundaryPath(stations: ViewportStation[]) {
  const minX = Math.min(...stations.map((station) => station.x));
  const maxX = Math.max(...stations.map((station) => station.x));
  const minY = Math.min(...stations.map((station) => station.y));
  const maxY = Math.max(...stations.map((station) => station.y));
  const padX = 56;
  const padY = 48;

  const left = Math.max(18, minX - padX);
  const right = Math.min(WIDTH - 18, maxX + padX);
  const top = Math.max(18, minY - padY);
  const bottom = Math.min(HEIGHT - 18, maxY + padY);
  const midX = (left + right) / 2;

  return [
    `M ${left + 62} ${top + 42}`,
    `C ${midX - 160} ${top - 18}, ${right - 120} ${top + 18}, ${right - 58} ${top + 82}`,
    `C ${right + 18} ${top + 160}, ${right - 14} ${bottom - 136}, ${right - 90} ${bottom - 62}`,
    `C ${midX + 104} ${bottom + 26}, ${left + 166} ${bottom + 4}, ${left + 82} ${bottom - 58}`,
    `C ${left - 18} ${bottom - 132}, ${left - 30} ${top + 188}, ${left + 62} ${top + 42}`,
    "Z",
  ].join(" ");
}
