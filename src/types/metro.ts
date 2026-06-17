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
