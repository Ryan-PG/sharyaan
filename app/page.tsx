import type { Metadata } from "next";
import HomePage from "@/views/HomePage";
import { toNextMetadata } from "@/services/metadata";
import { buildDefaultMetadata } from "@/services/seo";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = toNextMetadata(buildDefaultMetadata("/"));

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};

  return <HomePage initialFrom={firstParam(params.from)} initialTo={firstParam(params.to)} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
