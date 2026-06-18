import { useTranslation } from "react-i18next";
import type { Station } from "@/types/metro";
import { stationDisplayName } from "@/utils/text";

type LineMapPreviewProps = {
  color: string;
  stations: Station[];
};

const TEHRAN_BOUNDS = {
  west: 50.87,
  east: 51.648,
  south: 35.383,
  north: 35.917,
};

export function LineMapPreview({ color, stations }: LineMapPreviewProps) {
  const { t } = useTranslation();
  const points = stations.map((station) => ({
    station,
    ...project(station.longitude, station.latitude),
  }));

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-panel">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">{t("mapPreview")}</h2>
        <p className="text-sm text-muted-foreground">{stations.length} ایستگاه</p>
      </div>
      <div
        className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]"
        role="img"
        aria-label={t("mapPreview")}
      >
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]" />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.8"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {points.map((point, index) => (
          <span
            key={point.station.id}
            className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background text-[9px] font-semibold text-white shadow-panel"
            style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: color }}
            title={stationDisplayName(point.station, "fa")}
          >
            {index + 1}
          </span>
        ))}
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
