import type { Language } from "@/types/metro";

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function repairMojibake(value?: string) {
  if (!value) return "";
  if (!/[ØÙÛÚ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

export function stationDisplayName(
  station: { name: string; nameFa: string },
  language: Language,
) {
  return language === "fa" ? station.nameFa || station.name : station.name;
}

export function formatNumber(value: number, language: Language) {
  const formatted = new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);

  if (language === "fa") {
    return formatted.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
  }

  return formatted;
}

export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .trim();
}

export function listFormatter(language: Language) {
  return new Intl.ListFormat(language === "fa" ? "fa-IR" : "en-US", {
    style: "short",
    type: "conjunction",
  });
}
