import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { LineMapPreview } from "@/components/stations/LineMapPreview";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMetroData } from "@/hooks/useMetroData";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  buildLineJsonLd,
  buildLineMetadata,
  getLineById,
  SITE_NAME_FA,
  stationPath,
} from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";
import { formatNumber, stationDisplayName } from "@/utils/text";

export default function LinePage() {
  const { lineId = "" } = useParams();
  const { stations } = useMetroData();
  const numericLineId = Number(lineId);
  const line = useMemo(
    () => (Number.isFinite(numericLineId) ? getLineById(stations, numericLineId) : null),
    [numericLineId, stations],
  );
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);
  const metadata = useMemo(() => (line ? buildLineMetadata(line) : null), [line]);
  const jsonLd = useMemo(() => (line ? buildLineJsonLd(line) : null), [line]);

  usePageSeo(
    metadata ?? {
      title: `خط مترو تهران | ${SITE_NAME_FA}`,
      description: "اطلاعات خطوط مترو تهران",
      canonicalUrl: `${window.location.origin}/lines/${lineId}`,
    },
    jsonLd,
  );

  if (!line) return <Navigate to="/stations" replace />;

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

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span
                      className="size-4 rounded-full border border-foreground/15"
                      style={{ backgroundColor: line.color }}
                      aria-hidden
                    />
                    {line.name} مترو تهران
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatNumber(line.stations.length, language)} ایستگاه
                  </p>
                </div>
                <Badge className="min-h-8">{line.color}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <ol className="grid gap-2 md:grid-cols-2">
                {line.stations.map((station, index) => (
                  <li key={`${line.id}-${station.id}`}>
                    <Link
                      to={stationPath(station)}
                      className="flex min-h-12 items-center gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm transition hover:bg-muted"
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-white"
                        style={{ backgroundColor: line.color }}
                      >
                        {formatNumber(index + 1, language)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {stationDisplayName(station, language)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {language === "fa" ? station.name : station.nameFa}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <LineMapPreview color={line.color} stations={line.stations} />
        </section>
      </main>
    </motion.div>
  );
}
