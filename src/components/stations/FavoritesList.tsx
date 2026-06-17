import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Language, Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type FavoritesListProps = {
  stations: Station[];
  language: Language;
  favoriteIds: string[];
  onSelect: (stationId: string) => void;
};

export function FavoritesList({ stations, language, favoriteIds, onSelect }: FavoritesListProps) {
  const { t } = useTranslation();
  const favoriteStations = favoriteIds
    .map((id) => stations.find((station) => station.id === id))
    .filter((station): station is Station => Boolean(station));

  if (!favoriteStations.length) return null;

  return (
    <section className="space-y-3" aria-label={t("favorites")}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Heart className="size-4" aria-hidden />
        {t("favorites")}
      </div>
      <div className="flex flex-wrap gap-2">
        {favoriteStations.map((station) => (
          <Button
            key={station.id}
            variant="secondary"
            className="h-9 px-3 text-xs"
            onClick={() => onSelect(station.id)}
          >
            {stationDisplayName(station, language)}
          </Button>
        ))}
      </div>
    </section>
  );
}
