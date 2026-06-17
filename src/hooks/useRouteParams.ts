import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Station } from "@/types/metro";
import { useMetroStore } from "@/store/useMetroStore";

export function useRouteParams(stations: Station[]) {
  const [searchParams] = useSearchParams();
  const setOrigin = useMetroStore((state) => state.setOrigin);
  const setDestination = useMetroStore((state) => state.setDestination);

  useEffect(() => {
    const stationIds = new Set(stations.map((station) => station.id));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && stationIds.has(from)) setOrigin(from);
    if (to && stationIds.has(to)) setDestination(to);
  }, [searchParams, setDestination, setOrigin, stations]);
}
