import rawStations from "@/data/stations.json";
import type { RawStation, RawStations, Station } from "@/types/metro";
import { repairMojibake } from "@/utils/text";

const parsedStations = normalizeStations(rawStations as RawStations);

export function getStations() {
  return parsedStations;
}

export function getStationById(id: string) {
  return parsedStations.find((station) => station.id === id) ?? null;
}

export function getLineColor(station: Station, line: number | null) {
  if (line === null) return station.colors[0] ?? "#71717a";
  const index = station.lines.findIndex((stationLine) => stationLine === line);
  return station.colors[index] ?? station.colors[0] ?? "#71717a";
}

export function getLineColorFromStations(stations: Station[], line: number) {
  for (const station of stations) {
    const index = station.lines.indexOf(line);
    if (index >= 0 && station.colors[index]) {
      return station.colors[index];
    }
  }

  return "#71717a";
}

function normalizeStations(data: RawStations): Station[] {
  return Object.entries(data)
    .map(([id, station]) => toStation(id, station))
    .filter((station) => Number.isFinite(station.latitude) && Number.isFinite(station.longitude))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toStation(id: string, station: RawStation): Station {
  return {
    id,
    name: station.name || id,
    nameFa: repairMojibake(station.translations?.fa) || station.name || id,
    lines: station.lines.map(Number).filter(Number.isFinite),
    longitude: Number(station.longitude),
    latitude: Number(station.latitude),
    colors: station.colors?.length ? station.colors : ["#71717a"],
    relations: station.relations ?? [],
    disabled: Boolean(station.disabled),
  };
}
