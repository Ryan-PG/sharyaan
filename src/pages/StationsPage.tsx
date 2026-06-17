import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/AppHeader";
import { LineBadges } from "@/components/stations/LineBadges";
import { StationDataDialog } from "@/components/stations/StationDataDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMetroData } from "@/hooks/useMetroData";
import { usePageSeo } from "@/hooks/usePageSeo";
import { buildDefaultMetadata, buildLineGroups, linePath } from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";
import type { Station } from "@/types/metro";
import { formatNumber, stationDisplayName } from "@/utils/text";
import { Link } from "react-router-dom";

type LineGroup = {
  id: number;
  color: string;
  stations: Station[];
};

export default function StationsPage() {
  const { t } = useTranslation();
  const { stations } = useMetroData();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);

  const lineGroups = useMemo<LineGroup[]>(() => buildLineGroups(stations), [stations]);

  usePageSeo(buildDefaultMetadata("/stations"));

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

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
        <section className="pt-6 text-center sm:pt-10">
          <motion.h1
            className="mx-auto max-w-4xl text-balance text-3xl font-semibold tracking-normal sm:text-5xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {t("stationsDirectory")}
          </motion.h1>
          <motion.p
            className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 }}
          >
            {t("stationsDirectoryHint")}
          </motion.p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lineGroups.map((group) => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="border-b pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full border border-foreground/15"
                        style={{ backgroundColor: group.color }}
                        aria-hidden
                      />
                      <Link to={linePath(group.id)} className="hover:underline">
                        {t("line", { line: formatNumber(group.id, language) })}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("stationCount", {
                        value: formatNumber(group.stations.length, language),
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[520px] overflow-y-auto p-2">
                <div className="grid gap-1">
                  {group.stations.map((station) => (
                    <button
                      key={`${group.id}-${station.id}`}
                      type="button"
                      onClick={() => setSelectedStation(station)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {stationDisplayName(station, language)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {language === "fa" ? station.name : station.nameFa}
                        </span>
                      </span>
                      <span className="shrink-0">
                        <LineBadges station={station} language={language} compact />
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <StationDataDialog
        station={selectedStation}
        stations={stations}
        language={language}
        onClose={() => setSelectedStation(null)}
      />
    </motion.div>
  );
}
