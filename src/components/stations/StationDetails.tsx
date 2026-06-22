import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { LineBadges } from "@/components/stations/LineBadges";
import {
  getStationNeighbors,
  linePath,
  stationPath,
} from "@/services/seo";
import type { Language, Station, StationAmenities } from "@/types/metro";
import { formatNumber, stationDisplayName } from "@/utils/text";

type StationDetailsProps = {
  station: Station;
  stations: Station[];
  language: Language;
  linkRelatedStations?: boolean;
};

export function StationDetails({
  station,
  stations,
  language,
  linkRelatedStations = false,
}: StationDetailsProps) {
  const { t } = useTranslation();
  const coordinateFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: 6,
      }),
    [language],
  );
  const neighbors = useMemo(
    () => getStationNeighbors(station, stations),
    [station, stations],
  );
  const amenityItems = useMemo(
    () => buildAmenityItems(station.amenities, t),
    [station, t],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {stationDisplayName(station, language)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === "fa" ? station.name : station.nameFa}
          </p>
        </div>
        <LineBadges station={station} language={language} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DataItem label={t("stationId")} value={station.id} />
        <DataItem
          label={t("status")}
          value={station.disabled ? t("disabled") : t("active")}
        />
        <DataItem label={t("persianName")} value={station.nameFa || "-"} />
        <DataItem label={t("englishName")} value={station.name || "-"} />
        <DataItem label={t("address")} value={station.address || t("unknown")} />
        <DataItem
          label={t("latitude")}
          value={coordinateFormatter.format(station.latitude)}
        />
        <DataItem
          label={t("longitude")}
          value={coordinateFormatter.format(station.longitude)}
        />
      </div>

      <section className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{t("lineColors")}</p>
        <div className="flex flex-wrap gap-2">
          {station.lines.map((line, index) => {
            const color = station.colors[index] ?? station.colors[0] ?? "#71717a";
            const content = (
              <>
                <span
                  className="size-3 rounded-full border border-foreground/15"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {t("line", { line: formatNumber(line, language) })}
                <span className="text-muted-foreground">{color}</span>
              </>
            );

            return linkRelatedStations ? (
              <Link key={`${station.id}-${line}-${color}`} href={linePath(line)}>
                <Badge className="min-h-8">{content}</Badge>
              </Link>
            ) : (
              <Badge key={`${station.id}-${line}-${color}`} className="min-h-8">
                {content}
              </Badge>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{t("amenities")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {amenityItems.map((item) => (
            <AmenityItem
              key={item.key}
              label={item.label}
              value={item.value}
              yesLabel={t("yes")}
              noLabel={t("no")}
              unknownLabel={t("unknown")}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{t("connectedStations")}</p>
        {neighbors.nearby.length ? (
          <div className="flex flex-wrap gap-2">
            {neighbors.nearby.map((connectedStation) =>
              linkRelatedStations ? (
                <Link key={connectedStation.id} href={stationPath(connectedStation)}>
                  <Badge className="min-h-8">
                    {stationDisplayName(connectedStation, language)}
                  </Badge>
                </Link>
              ) : (
                <Badge key={connectedStation.id} className="min-h-8">
                  {stationDisplayName(connectedStation, language)}
                </Badge>
              ),
            )}
          </div>
        ) : (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t("noConnections")}
          </p>
        )}
      </section>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/35 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function AmenityItem({
  label,
  value,
  yesLabel,
  noLabel,
  unknownLabel,
}: {
  label: string;
  value: boolean | null;
  yesLabel: string;
  noLabel: string;
  unknownLabel: string;
}) {
  const valueClass =
    value === true
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : value === false
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      <span
        className={`inline-flex min-h-6 shrink-0 items-center rounded-md border px-2 text-xs font-semibold ${valueClass}`}
      >
        {value === true ? yesLabel : value === false ? noLabel : unknownLabel}
      </span>
    </div>
  );
}

function buildAmenityItems(
  amenities: StationAmenities,
  t: (key: string) => string,
): Array<{ key: keyof StationAmenities; label: string; value: boolean | null }> {
  return [
    { key: "wc", label: t("wc"), value: amenities.wc },
    { key: "coffeeShop", label: t("coffeeShop"), value: amenities.coffeeShop },
    { key: "groceryStore", label: t("groceryStore"), value: amenities.groceryStore },
    { key: "fastFood", label: t("fastFood"), value: amenities.fastFood },
    { key: "cleanFood", label: t("cleanFood"), value: amenities.cleanFood },
    { key: "atm", label: t("atm"), value: amenities.atm },
    { key: "elevator", label: t("elevator"), value: amenities.elevator },
    { key: "bicycleParking", label: t("bicycleParking"), value: amenities.bicycleParking },
    { key: "waterCooler", label: t("waterCooler"), value: amenities.waterCooler },
    { key: "blindPath", label: t("blindPath"), value: amenities.blindPath },
    {
      key: "fireSuppressionSystem",
      label: t("fireSuppressionSystem"),
      value: amenities.fireSuppressionSystem,
    },
    { key: "fireExtinguisher", label: t("fireExtinguisher"), value: amenities.fireExtinguisher },
    { key: "metroPolice", label: t("metroPolice"), value: amenities.metroPolice },
    { key: "creditTicketSales", label: t("creditTicketSales"), value: amenities.creditTicketSales },
    { key: "waitingChair", label: t("waitingChair"), value: amenities.waitingChair },
    { key: "camera", label: t("camera"), value: amenities.camera },
    { key: "trashCan", label: t("trashCan"), value: amenities.trashCan },
    { key: "smoking", label: t("smoking"), value: amenities.smoking },
    { key: "petsAllowed", label: t("petsAllowed"), value: amenities.petsAllowed },
    { key: "freeWifi", label: t("freeWifi"), value: amenities.freeWifi },
    { key: "prayerRoom", label: t("prayerRoom"), value: amenities.prayerRoom },
  ];
}
