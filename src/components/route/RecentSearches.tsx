import { History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Language, Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type RecentRoute = {
  originId: string;
  destinationId: string;
  createdAt: number;
};

type RecentSearchesProps = {
  stations: Station[];
  language: Language;
  recentRoutes: RecentRoute[];
  onSelect: (originId: string, destinationId: string) => void;
};

export function RecentSearches({
  stations,
  language,
  recentRoutes,
  onSelect,
}: RecentSearchesProps) {
  const { t } = useTranslation();
  const byId = new Map(stations.map((station) => [station.id, station]));
  const routes = recentRoutes
    .map((route) => ({
      ...route,
      origin: byId.get(route.originId),
      destination: byId.get(route.destinationId),
    }))
    .filter(
      (route): route is RecentRoute & { origin: Station; destination: Station } =>
        Boolean(route.origin && route.destination),
    );

  if (!routes.length) return null;

  return (
    <section className="space-y-3" aria-label={t("recentSearches")}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="size-4" aria-hidden />
        {t("recentSearches")}
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1">
        {routes.map((route) => (
          <Button
            key={`${route.originId}-${route.destinationId}-${route.createdAt}`}
            variant="secondary"
            className="h-10 shrink-0 px-3 text-xs"
            onClick={() => onSelect(route.originId, route.destinationId)}
          >
            {t("fromTo", {
              from: stationDisplayName(route.origin, language),
              to: stationDisplayName(route.destination, language),
            })}
          </Button>
        ))}
      </div>
    </section>
  );
}
