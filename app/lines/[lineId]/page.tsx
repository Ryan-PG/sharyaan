import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import LinePage from "@/views/LinePage";
import { getStations } from "@/services/metro";
import { toNextMetadata } from "@/services/metadata";
import {
  buildLineGroups,
  buildLineJsonLd,
  buildLineMetadata,
  getLineById,
} from "@/services/seo";

type LineRouteParams = {
  lineId: string;
};

export function generateStaticParams(): LineRouteParams[] {
  return buildLineGroups(getStations()).map((line) => ({ lineId: String(line.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LineRouteParams>;
}): Promise<Metadata> {
  const { lineId } = await params;
  const numericLineId = Number(lineId);
  const line = Number.isFinite(numericLineId) ? getLineById(getStations(), numericLineId) : null;

  if (!line) return {};

  return toNextMetadata(buildLineMetadata(line));
}

export default async function Page({
  params,
}: {
  params: Promise<LineRouteParams>;
}) {
  const { lineId } = await params;
  const numericLineId = Number(lineId);
  const line = Number.isFinite(numericLineId) ? getLineById(getStations(), numericLineId) : null;

  if (!line) redirect("/stations");

  return (
    <>
      <StructuredData data={buildLineJsonLd(line)} />
      <LinePage lineId={lineId} />
    </>
  );
}
