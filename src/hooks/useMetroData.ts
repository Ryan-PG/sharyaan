import { useMemo } from "react";
import { buildGraph } from "@/services/graph";
import { getStations } from "@/services/metro";

export function useMetroData() {
  return useMemo(() => {
    const stations = getStations();
    const graph = buildGraph(stations);
    return { stations, graph };
  }, []);
}
