import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { StationDetails } from "@/components/stations/StationDetails";
import { StationMapPreview } from "@/components/stations/StationMapPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMetroData } from "@/hooks/useMetroData";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  buildStationJsonLd,
  buildStationMetadata,
  findStationBySlug,
  getStationNeighbors,
  linePath,
  stationPath,
} from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";
import { formatNumber, stationDisplayName } from "@/utils/text";

export default function StationPage() {
  const { slug = "" } = useParams();
  const { stations } = useMetroData();
  const station = useMemo(() => findStationBySlug(stations, slug), [slug, stations]);
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);
  const metadata = useMemo(
    () => (station ? buildStationMetadata(station) : null),
    [station],
  );
  const jsonLd = useMemo(
    () => (station ? buildStationJsonLd(station, stations) : null),
    [station, stations],
  );
  const neighbors = useMemo(
    () => (station ? getStationNeighbors(station, stations) : null),
    [station, stations],
  );

  usePageSeo(
    metadata ?? {
      title: "ایستگاه مترو | مسیریاب مترو تهران",
      description: "اطلاعات ایستگاههای مترو تهران",
      canonicalUrl: `${window.location.origin}/stations/${slug}`,
    },
    jsonLd,
  );

  if (!station) return <Navigate to="/stations" replace />;

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

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <StationDetails
                station={station}
                stations={stations}
                language={language}
                linkRelatedStations
              />
            </CardContent>
          </Card>

          <StationMapPreview station={station} stations={stations} />
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle>لینکهای مرتبط</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">خطوط ایستگاه</p>
                <div className="flex flex-wrap gap-2">
                  {station.lines.map((line) => (
                    <Link key={line} to={linePath(line)}>
                      <Badge className="min-h-8">
                        خط {formatNumber(line, language)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <RelatedStationList
                title="ایستگاه قبلی"
                stations={neighbors?.previous ?? []}
                language={language}
              />
              <RelatedStationList
                title="ایستگاه بعدی"
                stations={neighbors?.next ?? []}
                language={language}
              />
              <RelatedStationList
                title="ایستگاههای نزدیک"
                stations={neighbors?.nearby ?? []}
                language={language}
              />

              <Link to="/">
                <Button variant="secondary" className="w-full">
                  مسیریابی از این ایستگاه
                </Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </main>
    </motion.div>
  );
}

function RelatedStationList({
  title,
  stations,
  language,
}: {
  title: string;
  stations: ReturnType<typeof getStationNeighbors>["nearby"];
  language: "en" | "fa";
}) {
  if (!stations.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid gap-2">
        {stations.map((station) => (
          <Link
            key={`${title}-${station.id}`}
            to={stationPath(station)}
            className="rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            {stationDisplayName(station, language)}
          </Link>
        ))}
      </div>
    </div>
  );
}
