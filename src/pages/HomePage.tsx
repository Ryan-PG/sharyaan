import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/AppHeader";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { RouteEmptyState } from "@/components/route/RouteEmptyState";
import { RecentSearches } from "@/components/route/RecentSearches";
import { RouteResultPanel } from "@/components/route/RouteResultPanel";
import { RouteSelectionCard } from "@/components/route/RouteSelectionCard";
import { FavoritesList } from "@/components/stations/FavoritesList";
import { StationDetailsSheet } from "@/components/stations/StationDetailsSheet";
import { findShortestPath } from "@/services/dijkstra";
import { buildRouteUrl } from "@/services/share";
import { useMetroStore } from "@/store/useMetroStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMetroData } from "@/hooks/useMetroData";
import { useRouteParams } from "@/hooks/useRouteParams";

const MetroMap = lazy(() => import("@/components/map/MetroMap"));

export default function HomePage() {
  const { t } = useTranslation();
  const { stations, graph } = useMetroData();
  const [focusToken, setFocusToken] = useState(0);
  const [routeRequested, setRouteRequested] = useState(false);

  const originId = useMetroStore((state) => state.originId);
  const destinationId = useMetroStore((state) => state.destinationId);
  const selectedStationId = useMetroStore((state) => state.selectedStationId);
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const recentRoutes = useMetroStore((state) => state.recentRoutes);
  const favoriteStationIds = useMetroStore((state) => state.favoriteStationIds);
  const setOrigin = useMetroStore((state) => state.setOrigin);
  const setDestination = useMetroStore((state) => state.setDestination);
  const setSelectedStation = useMetroStore((state) => state.setSelectedStation);
  const swapStations = useMetroStore((state) => state.swapStations);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);
  const addRecentRoute = useMetroStore((state) => state.addRecentRoute);
  const toggleFavorite = useMetroStore((state) => state.toggleFavorite);

  useRouteParams(stations);

  const route = useMemo(() => {
    if (!routeRequested && !(originId && destinationId)) return null;
    return findShortestPath(graph, originId, destinationId);
  }, [destinationId, graph, originId, routeRequested]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, stations],
  );

  const copiedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildRouteUrl(originId, destinationId);
  }, [destinationId, originId]);

  const findRoute = useCallback(() => {
    if (!originId || !destinationId || originId === destinationId) {
      setRouteRequested(true);
      return;
    }

    setRouteRequested(true);
    addRecentRoute(originId, destinationId);
  }, [addRecentRoute, destinationId, originId]);

  const handleStationClick = useCallback(
    (stationId: string) => {
      setSelectedStation(stationId);

      if (!originId || (originId && destinationId)) {
        setOrigin(stationId);
        if (originId && destinationId) setDestination(null);
        return;
      }

      if (originId !== stationId) {
        setDestination(stationId);
        setRouteRequested(true);
        addRecentRoute(originId, stationId);
      }
    },
    [addRecentRoute, destinationId, originId, setDestination, setOrigin, setSelectedStation],
  );

  useKeyboardShortcuts({
    onSearch: () => setFocusToken((value) => value + 1),
    onSwap: swapStations,
    onFindRoute: findRoute,
  });

  const routeMessage = useMemo(() => {
    if (originId && destinationId && originId === destinationId) return t("sameStation");
    if (routeRequested && originId && destinationId && !route) return t("noRoute");
    return t("emptyRoute");
  }, [destinationId, originId, route, routeRequested, t]);

  const currentFavorite = selectedStation
    ? favoriteStationIds.includes(selectedStation.id)
    : false;

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader
        language={language}
        theme={theme}
        onLanguageChange={setLanguage}
        onThemeChange={setTheme}
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
        <section className="pt-6 text-center sm:pt-12">
          <motion.h1
            className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-normal sm:text-6xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {t("appName")}
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 }}
          >
            {t("subtitle")}
          </motion.p>
        </section>

        <RouteSelectionCard
          stations={stations}
          language={language}
          originId={originId}
          destinationId={destinationId}
          focusToken={focusToken}
          onOriginChange={(stationId) => {
            setOrigin(stationId);
            setRouteRequested(false);
          }}
          onDestinationChange={(stationId) => {
            setDestination(stationId);
            setRouteRequested(false);
          }}
          onSwap={swapStations}
          onFindRoute={findRoute}
        />

        <div className="mx-auto grid w-full max-w-3xl gap-4">
          <RecentSearches
            stations={stations}
            language={language}
            recentRoutes={recentRoutes}
            onSelect={(recentOrigin, recentDestination) => {
              setOrigin(recentOrigin);
              setDestination(recentDestination);
              setRouteRequested(true);
            }}
          />
          <FavoritesList
            stations={stations}
            language={language}
            favoriteIds={favoriteStationIds}
            onSelect={(stationId) => {
              if (!originId || (originId && destinationId)) {
                setOrigin(stationId);
                setDestination(null);
              } else if (originId !== stationId) {
                setDestination(stationId);
              }
              setSelectedStation(stationId);
            }}
          />
          <p className="text-center text-xs text-muted-foreground">{t("keyboardHint")}</p>
        </div>

        <Suspense fallback={<MapSkeleton />}>
          <MetroMap
            stations={stations}
            language={language}
            originId={originId}
            destinationId={destinationId}
            selectedStationId={selectedStationId}
            route={route}
            onStationClick={handleStationClick}
          />
        </Suspense>

        {route ? (
          <RouteResultPanel route={route} language={language} copiedUrl={copiedUrl} />
        ) : (
          <RouteEmptyState message={routeMessage} />
        )}
      </main>

      <StationDetailsSheet
        station={selectedStation}
        language={language}
        favorite={currentFavorite}
        onToggleFavorite={() => selectedStation && toggleFavorite(selectedStation.id)}
        onClose={() => setSelectedStation(null)}
      />
    </motion.div>
  );
}
