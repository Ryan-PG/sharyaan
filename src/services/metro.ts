import rawStations from "@/data/stations.json";
import type { RawStation, RawStations, Station } from "@/types/metro";
import { compareStationPersianNames, repairMojibake } from "@/utils/text";

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
    .sort(compareStationPersianNames);
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
    address: repairMojibake(station.address) || "",
    amenities: {
      wc: toNullableBoolean(station.wc),
      coffeeShop: toNullableBoolean(station.coffeeShop),
      groceryStore: toNullableBoolean(station.groceryStore),
      fastFood: toNullableBoolean(station.fastFood ?? station.fastFoodn),
      atm: toNullableBoolean(station.atm),
      elevator: toNullableBoolean(station.elevator),
      bicycleParking: toNullableBoolean(station.bicycleParking),
      waterCooler: toNullableBoolean(station.waterCooler),
      cleanFood: toNullableBoolean(station.cleanFood),
      blindPath: toNullableBoolean(station.blindPath),
      fireSuppressionSystem: toNullableBoolean(station.fireSuppressionSystem),
      fireExtinguisher: toNullableBoolean(station.fireExtinguisher),
      metroPolice: toNullableBoolean(station.metroPolice),
      creditTicketSales: toNullableBoolean(station.creditTicketSales),
      waitingChair: toNullableBoolean(station.waitingChair),
      camera: toNullableBoolean(station.camera),
      trashCan: toNullableBoolean(station.trashCan),
      smoking: toNullableBoolean(station.smoking),
      petsAllowed: toNullableBoolean(station.petsAllowed),
      freeWifi: toNullableBoolean(station.freeWifi),
      prayerRoom: toNullableBoolean(station.prayerRoom),
    },
  };
}

function toNullableBoolean(value: boolean | null | undefined) {
  return typeof value === "boolean" ? value : null;
}
