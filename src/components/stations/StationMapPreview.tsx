import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type StationMapPreviewProps = {
  station: Station;
  stations?: Station[];
};

const TEHRAN_BOUNDS = {
  west: 50.87,
  east: 51.648,
  south: 35.383,
  north: 35.917,
};

export function StationMapPreview({ station, stations = [] }: StationMapPreviewProps) {
  const { t } = useTranslation();
  const position = project(station.longitude, station.latitude);
  const related = stations.filter((item) => station.relations.includes(item.id));

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-panel">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">{t("mapPreview")}</h2>
        <p className="text-sm text-muted-foreground">{stationDisplayName(station, "fa")}</p>
      </div>
      <div
        className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]"
        role="img"
        aria-label={`${t("mapPreview")} ${stationDisplayName(station, "fa")}`}
      >
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]" />
        {related.map((relatedStation) => {
          const relatedPosition = project(relatedStation.longitude, relatedStation.latitude);

          return (
            <span
              key={relatedStation.id}
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-muted-foreground"
              style={{ left: `${relatedPosition.x}%`, top: `${relatedPosition.y}%` }}
              title={stationDisplayName(relatedStation, "fa")}
            />
          );
        })}
        <div
          className="absolute grid -translate-x-1/2 -translate-y-full place-items-center gap-1"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <MapPin className="size-8 fill-primary text-primary" aria-hidden />
          <span className="max-w-48 rounded-md border bg-card/95 px-2 py-1 text-center text-xs font-semibold shadow-panel">
            {stationDisplayName(station, "fa")}
          </span>
        </div>
      </div>
    </section>
  );
}

function project(longitude: number, latitude: number) {
  const x =
    ((longitude - TEHRAN_BOUNDS.west) / (TEHRAN_BOUNDS.east - TEHRAN_BOUNDS.west)) * 100;
  const y =
    (1 - (latitude - TEHRAN_BOUNDS.south) / (TEHRAN_BOUNDS.north - TEHRAN_BOUNDS.south)) *
    100;

  return {
    x: clamp(x, 5, 95),
    y: clamp(y, 8, 92),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
