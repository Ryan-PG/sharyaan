export type Language = "en" | "fa";
export type ThemeMode = "light" | "dark";

export type RawStation = {
  name: string;
  translations?: {
    fa?: string;
    [key: string]: string | undefined;
  };
  lines: number[];
  longitude: string | number;
  latitude: string | number;
  colors: string[];
  disabled?: boolean;
  address?: string;
  wc?: boolean | null;
  coffeeShop?: boolean | null;
  groceryStore?: boolean | null;
  fastFood?: boolean | null;
  fastFoodn?: boolean | null;
  atm?: boolean | null;
  elevator?: boolean | null;
  bicycleParking?: boolean | null;
  waterCooler?: boolean | null;
  cleanFood?: boolean | null;
  blindPath?: boolean | null;
  fireSuppressionSystem?: boolean | null;
  fireExtinguisher?: boolean | null;
  metroPolice?: boolean | null;
  creditTicketSales?: boolean | null;
  waitingChair?: boolean | null;
  camera?: boolean | null;
  trashCan?: boolean | null;
  smoking?: boolean | null;
  petsAllowed?: boolean | null;
  freeWifi?: boolean | null;
  prayerRoom?: boolean | null;
  relations: string[];
};

export type RawStations = Record<string, RawStation>;

export type Station = {
  id: string;
  name: string;
  nameFa: string;
  lines: number[];
  longitude: number;
  latitude: number;
  colors: string[];
  relations: string[];
  disabled: boolean;
  address: string;
  amenities: StationAmenities;
};

export type StationAmenities = {
  wc: boolean | null;
  coffeeShop: boolean | null;
  groceryStore: boolean | null;
  fastFood: boolean | null;
  atm: boolean | null;
  elevator: boolean | null;
  bicycleParking: boolean | null;
  waterCooler: boolean | null;
  cleanFood: boolean | null;
  blindPath: boolean | null;
  fireSuppressionSystem: boolean | null;
  fireExtinguisher: boolean | null;
  metroPolice: boolean | null;
  creditTicketSales: boolean | null;
  waitingChair: boolean | null;
  camera: boolean | null;
  trashCan: boolean | null;
  smoking: boolean | null;
  petsAllowed: boolean | null;
  freeWifi: boolean | null;
  prayerRoom: boolean | null;
};

export type GraphEdge = {
  to: string;
  sharedLines: number[];
  distance: number;
};

export type MetroGraph = {
  stations: Map<string, Station>;
  adjacency: Map<string, GraphEdge[]>;
};

export type RouteStep = {
  station: Station;
  line: number | null;
  color: string;
  transferTo?: number;
  transferDirection?: Station;
};

export type RouteResult = {
  origin: Station;
  destination: Station;
  stations: Station[];
  steps: RouteStep[];
  stops: number;
  transfers: number;
  linesUsed: number[];
  estimatedMinutes: number;
};

export type ViewportStation = Station & {
  x: number;
  y: number;
};
