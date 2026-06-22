"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { StationDetails } from "@/components/stations/StationDetails";
import { StationMapPreview } from "@/components/stations/StationMapPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMetroData } from "@/hooks/useMetroData";
import {
  findStationBySlug,
  getStationNeighbors,
  linePath,
  stationPath,
} from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";
import { formatNumber, stationDisplayName } from "@/utils/text";

type StationPageProps = {
  slug: string;
};

export default function StationPage({ slug }: StationPageProps) {
  const { stations } = useMetroData();
  const station = useMemo(() => findStationBySlug(stations, slug), [slug, stations]);
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);
  const neighbors = useMemo(
    () => (station ? getStationNeighbors(station, stations) : null),
    [station, stations],
  );

  if (!station) return null;

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
              <CardTitle>Related links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Station lines</p>
                <div className="flex flex-wrap gap-2">
                  {station.lines.map((line) => (
                    <Link key={line} href={linePath(line)}>
                      <Badge className="min-h-8">Line {formatNumber(line, language)}</Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <RelatedStationList
                title="Previous stations"
                stations={neighbors?.previous ?? []}
                language={language}
              />
              <RelatedStationList
                title="Next stations"
                stations={neighbors?.next ?? []}
                language={language}
              />
              <RelatedStationList
                title="Nearby stations"
                stations={neighbors?.nearby ?? []}
                language={language}
              />

              <Link href="/">
                <Button variant="secondary" className="w-full">
                  Plan a route from this station
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
            href={stationPath(station)}
            className="rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            {stationDisplayName(station, language)}
          </Link>
        ))}
      </div>
    </div>
  );
}
