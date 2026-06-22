import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import StationPage from "@/views/StationPage";
import { getStations } from "@/services/metro";
import { toNextMetadata } from "@/services/metadata";
import {
  buildStationJsonLd,
  buildStationMetadata,
  findStationBySlug,
  stationSlug,
} from "@/services/seo";

type StationRouteParams = {
  slug: string;
};

export function generateStaticParams(): StationRouteParams[] {
  return getStations().map((station) => ({ slug: stationSlug(station) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<StationRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = findStationBySlug(getStations(), slug);

  if (!station) return {};

  return toNextMetadata(buildStationMetadata(station));
}

export default async function Page({
  params,
}: {
  params: Promise<StationRouteParams>;
}) {
  const { slug } = await params;
  const stations = getStations();
  const station = findStationBySlug(stations, slug);

  if (!station) redirect("/stations");

  return (
    <>
      <StructuredData data={buildStationJsonLd(station, stations)} />
      <StationPage slug={slug} />
    </>
  );
}
