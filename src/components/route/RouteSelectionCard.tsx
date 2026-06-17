import { motion } from "framer-motion";
import { ArrowRightLeft, Loader2, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StationCombobox } from "@/components/stations/StationCombobox";
import type { Language, Station } from "@/types/metro";

type RouteSelectionCardProps = {
  stations: Station[];
  language: Language;
  originId: string | null;
  destinationId: string | null;
  loading?: boolean;
  focusToken?: number;
  onOriginChange: (stationId: string | null) => void;
  onDestinationChange: (stationId: string | null) => void;
  onSwap: () => void;
  onFindRoute: () => void;
};

export function RouteSelectionCard({
  stations,
  language,
  originId,
  destinationId,
  loading,
  focusToken,
  onOriginChange,
  onDestinationChange,
  onSwap,
  onFindRoute,
}: RouteSelectionCardProps) {
  const { t } = useTranslation();
  const canRoute = Boolean(originId && destinationId && originId !== destinationId);

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <StationCombobox
            label={t("origin")}
            stations={stations}
            value={originId}
            language={language}
            onChange={onOriginChange}
            autoFocusToken={focusToken}
          />

          <motion.div
            className="flex justify-center md:pb-1"
            whileTap={{ rotate: 180, scale: 0.94 }}
            transition={{ duration: 0.16 }}
          >
            <Button
              variant="icon"
              className="size-11"
              onClick={onSwap}
              disabled={!originId && !destinationId}
              aria-label={t("swapStations")}
            >
              <ArrowRightLeft className="size-4" aria-hidden />
            </Button>
          </motion.div>

          <StationCombobox
            label={t("destination")}
            stations={stations}
            value={destinationId}
            language={language}
            onChange={onDestinationChange}
          />
        </div>

        <Button
          variant="primary"
          className="mt-5 h-12 w-full text-base"
          onClick={onFindRoute}
          disabled={!canRoute || loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Navigation className="size-4" aria-hidden />
          )}
          {t("findRoute")}
        </Button>
      </CardContent>
    </Card>
  );
}
