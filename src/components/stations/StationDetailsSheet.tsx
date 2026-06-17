import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { LineBadges } from "@/components/stations/LineBadges";
import type { Language, Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type StationDetailsSheetProps = {
  station: Station | null;
  language: Language;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

export function StationDetailsSheet({
  station,
  language,
  favorite,
  onToggleFavorite,
  onClose,
}: StationDetailsSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={Boolean(station)} title={t("stationDetails")} onClose={onClose}>
      {station ? (
        <div className="space-y-6">
          <div>
            <p className="text-2xl font-semibold tracking-normal">
              {stationDisplayName(station, language)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {language === "fa" ? station.name : station.nameFa}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("lines")}</p>
            <LineBadges station={station} language={language} />
          </div>

          <Button variant="secondary" className="w-full" onClick={onToggleFavorite}>
            <Heart className={favorite ? "size-4 fill-current" : "size-4"} aria-hidden />
            {favorite ? t("unfavorite") : t("favorite")}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
