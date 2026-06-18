import { useTranslation } from "react-i18next";
import { StationDetails } from "@/components/stations/StationDetails";
import { Dialog } from "@/components/ui/Dialog";
import type { Language, Station } from "@/types/metro";

type StationDataDialogProps = {
  station: Station | null;
  stations: Station[];
  language: Language;
  onClose: () => void;
};

export function StationDataDialog({
  station,
  stations,
  language,
  onClose,
}: StationDataDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={Boolean(station)} title={t("stationData")} onClose={onClose}>
      {station ? (
        <StationDetails station={station} stations={stations} language={language} />
      ) : null}
    </Dialog>
  );
}
