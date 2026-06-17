import type { MetroGraph, RouteResult, RouteStep, Station } from "@/types/metro";
import { getLineColor, getLineColorFromStations } from "@/services/metro";

type QueueNode = {
  id: string;
  line: number | null;
  cost: number;
  stops: number;
  transfers: number;
};

type PreviousNode = {
  id: string;
  line: number | null;
};

const STOP_WEIGHT = 100;
const TRANSFER_WEIGHT = 38;
const DISTANCE_WEIGHT = 0.004;

export function findShortestPath(
  graph: MetroGraph,
  originId: string | null,
  destinationId: string | null,
): RouteResult | null {
  if (!originId || !destinationId || originId === destinationId) return null;

  const origin = graph.stations.get(originId);
  const destination = graph.stations.get(destinationId);
  if (!origin || !destination) return null;

  const distances = new Map<string, number>();
  const stats = new Map<string, Pick<QueueNode, "stops" | "transfers">>();
  const previous = new Map<string, PreviousNode>();
  const queue = new MinQueue<QueueNode>((a, b) => a.cost - b.cost);

  const startKey = stateKey(originId, null);
  distances.set(startKey, 0);
  stats.set(startKey, { stops: 0, transfers: 0 });
  queue.push({ id: originId, line: null, cost: 0, stops: 0, transfers: 0 });

  let bestDestination: QueueNode | null = null;

  while (queue.size > 0) {
    const current = queue.pop();
    if (!current) break;

    const key = stateKey(current.id, current.line);
    if (current.cost > (distances.get(key) ?? Number.POSITIVE_INFINITY)) continue;

    if (current.id === destinationId) {
      bestDestination = current;
      break;
    }

    for (const edge of graph.adjacency.get(current.id) ?? []) {
      const nextLines = edge.sharedLines.length ? edge.sharedLines : [current.line];

      for (const nextLine of nextLines) {
        const line = nextLine ?? null;
        const transfer = current.line !== null && line !== current.line ? 1 : 0;
        const stepCost = STOP_WEIGHT + edge.distance * DISTANCE_WEIGHT + transfer * TRANSFER_WEIGHT;
        const nextCost = current.cost + stepCost;
        const nextKey = stateKey(edge.to, line);
        const nextStats = {
          stops: current.stops + 1,
          transfers: current.transfers + transfer,
        };
        const knownCost = distances.get(nextKey) ?? Number.POSITIVE_INFINITY;
        const knownStats = stats.get(nextKey);
        const isBetter =
          nextCost < knownCost ||
          (Math.abs(nextCost - knownCost) < 0.001 &&
            (!knownStats ||
              nextStats.transfers < knownStats.transfers ||
              (nextStats.transfers === knownStats.transfers && nextStats.stops < knownStats.stops)));

        if (!isBetter) continue;

        distances.set(nextKey, nextCost);
        stats.set(nextKey, nextStats);
        previous.set(nextKey, { id: current.id, line: current.line });
        queue.push({
          id: edge.to,
          line,
          cost: nextCost,
          stops: nextStats.stops,
          transfers: nextStats.transfers,
        });
      }
    }
  }

  if (!bestDestination) return null;

  const routeStates = reconstructPath(bestDestination, previous).reverse();
  const stations = routeStates
    .map((state) => graph.stations.get(state.id))
    .filter((station): station is Station => Boolean(station));

  if (stations.length < 2) return null;

  const steps = buildSteps(stations, routeStates.map((state) => state.line), graph);
  const linesUsed = Array.from(new Set(steps.map((step) => step.line).filter(isNumber)));
  const transfers = steps.filter((step) => step.transferTo !== undefined).length;

  return {
    origin,
    destination,
    stations,
    steps,
    stops: Math.max(0, stations.length - 1),
    transfers,
    linesUsed,
    estimatedMinutes: estimateMinutes(stations.length - 1, transfers),
  };
}

function buildSteps(
  stations: Station[],
  lines: Array<number | null>,
  graph: MetroGraph,
): RouteStep[] {
  const firstLine = lines.find(isNumber) ?? stations[0]?.lines[0] ?? null;

  return stations.map((station, index) => {
    const previousLine = index > 0 ? lines[index - 1] : null;
    const currentLine = lines[index] ?? previousLine ?? firstLine;
    const transferTo =
      index < stations.length - 1 &&
      currentLine !== null &&
      lines[index + 1] !== null &&
      lines[index + 1] !== currentLine
        ? lines[index + 1]!
        : undefined;
    const nextRouteStation = stations[index + 1];

    return {
      station,
      line: currentLine,
      color: getLineColor(station, currentLine) || getLineColorFromStations(stations, currentLine ?? 0),
      transferTo,
      transferDirection:
        transferTo !== undefined && nextRouteStation
          ? findLineTerminal(graph, station, nextRouteStation, transferTo)
          : undefined,
    };
  });
}

function findLineTerminal(
  graph: MetroGraph,
  transferStation: Station,
  nextRouteStation: Station,
  line: number,
) {
  const visited = new Set<string>([transferStation.id]);
  let previous = transferStation;
  let current = nextRouteStation;

  while (true) {
    visited.add(current.id);
    const next = (graph.adjacency.get(current.id) ?? [])
      .map((edge) => graph.stations.get(edge.to))
      .filter((station): station is Station => Boolean(station))
      .filter((station) => station.id !== previous.id)
      .filter((station) => !visited.has(station.id))
      .filter((station) => station.lines.includes(line));

    if (next.length === 0) return current;

    next.sort((a, b) => {
      const distanceA = distanceSquared(current, a);
      const distanceB = distanceSquared(current, b);
      return distanceA - distanceB;
    });

    previous = current;
    current = next[0];
  }
}

function reconstructPath(end: QueueNode, previous: Map<string, PreviousNode>) {
  const path: PreviousNode[] = [{ id: end.id, line: end.line }];
  let cursor = stateKey(end.id, end.line);

  while (previous.has(cursor)) {
    const prev = previous.get(cursor)!;
    path.push(prev);
    cursor = stateKey(prev.id, prev.line);
  }

  return path;
}

function estimateMinutes(stops: number, transfers: number) {
  return Math.max(2, Math.round(stops * 1.7 + transfers * 5 + 3));
}

function stateKey(id: string, line: number | null) {
  return `${id}::${line ?? "start"}`;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function distanceSquared(a: Station, b: Station) {
  return (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2;
}

class MinQueue<T> {
  private items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size() {
    return this.items.length;
  }

  push(item: T) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const end = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = end;
      this.sinkDown(0);
    }

    return top;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parent]) >= 0) break;
      [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
      index = parent;
    }
  }

  private sinkDown(index: number) {
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }

      if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.items[smallest], this.items[index]] = [this.items[index], this.items[smallest]];
      index = smallest;
    }
  }
}
