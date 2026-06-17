import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import type { Station } from "@/types/metro";
import type { Language } from "@/types/metro";
import { formatNumber } from "@/utils/text";

type LineBadgesProps = {
  station: Station;
  language: Language;
  compact?: boolean;
};

export function LineBadges({ station, language, compact = false }: LineBadgesProps) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {station.lines.map((line, index) => (
        <Badge
          key={`${station.id}-${line}`}
          className={compact ? "h-5 px-1.5 text-[11px]" : undefined}
          title={t("line", { line: formatNumber(line, language) })}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: station.colors[index] ?? station.colors[0] }}
            aria-hidden
          />
          {formatNumber(line, language)}
        </Badge>
      ))}
    </span>
  );
}
