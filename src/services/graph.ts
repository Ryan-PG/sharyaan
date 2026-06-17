import type { GraphEdge, MetroGraph, Station } from "@/types/metro";

export function buildGraph(stations: Station[]): MetroGraph {
  const stationMap = new Map(stations.map((station) => [station.id, station]));
  const adjacency = new Map<string, GraphEdge[]>();

  for (const station of stations) {
    adjacency.set(station.id, []);
  }

  for (const station of stations) {
    for (const relationId of station.relations) {
      const relation = stationMap.get(relationId);
      if (!relation || relation.disabled) continue;

      addEdge(adjacency, station, relation);
      addEdge(adjacency, relation, station);
    }
  }

  for (const [stationId, edges] of adjacency) {
    adjacency.set(stationId, dedupeEdges(edges));
  }

  return {
    stations: stationMap,
    adjacency,
  };
}

function addEdge(adjacency: Map<string, GraphEdge[]>, from: Station, to: Station) {
  adjacency.get(from.id)?.push({
    to: to.id,
    sharedLines: sharedLines(from, to),
    distance: haversineMeters(from.latitude, from.longitude, to.latitude, to.longitude),
  });
}

function sharedLines(a: Station, b: Station) {
  return a.lines.filter((line) => b.lines.includes(line));
}

function dedupeEdges(edges: GraphEdge[]) {
  const byStation = new Map<string, GraphEdge>();
  for (const edge of edges) {
    const existing = byStation.get(edge.to);
    if (!existing || edge.sharedLines.length > existing.sharedLines.length) {
      byStation.set(edge.to, edge);
    }
  }

  return Array.from(byStation.values());
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
