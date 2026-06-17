import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LineBadges } from "@/components/stations/LineBadges";
import type { Language, Station } from "@/types/metro";
import { cn } from "@/utils/cn";
import { compareStationPersianNames, normalizeSearch, stationDisplayName } from "@/utils/text";

type StationComboboxProps = {
  label: string;
  stations: Station[];
  value: string | null;
  language: Language;
  onChange: (stationId: string | null) => void;
  autoFocusToken?: number;
};

const MAX_RESULTS = 80;

export function StationCombobox({
  label,
  stations,
  value,
  language,
  onChange,
  autoFocusToken,
}: StationComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => stations.find((station) => station.id === value) ?? null,
    [stations, value],
  );

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(query);
    const ranked = stations
      .filter((station) => {
        if (!normalized) return true;
        return (
          normalizeSearch(station.name).includes(normalized) ||
          normalizeSearch(station.nameFa).includes(normalized) ||
          String(station.lines.join(" ")).includes(normalized)
        );
      })
      .sort((a, b) => {
        if (!normalized) return compareStationPersianNames(a, b);
        const aName = normalizeSearch(`${a.name} ${a.nameFa}`);
        const bName = normalizeSearch(`${b.name} ${b.nameFa}`);
        const aStarts = aName.startsWith(normalized) ? 0 : 1;
        const bStarts = bName.startsWith(normalized) ? 0 : 1;
        return aStarts - bStarts || compareStationPersianNames(a, b);
      });

    return ranked.slice(0, MAX_RESULTS);
  }, [query, stations]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!autoFocusToken) return;
    inputRef.current?.focus();
    setOpen(true);
  }, [autoFocusToken]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const chooseStation = (station: Station) => {
    onChange(station.id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={open ? query : selected ? stationDisplayName(selected, language) : ""}
          placeholder={t("searchStation")}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
              setOpen(true);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && filtered[activeIndex]) {
              event.preventDefault();
              chooseStation(filtered[activeIndex]);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="pe-12 ps-9"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${label}-stations`}
          aria-autocomplete="list"
        />
        <Button
          variant="ghost"
          className="absolute end-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-md p-0"
          onClick={() => {
            setOpen((state) => !state);
            inputRef.current?.focus();
          }}
          aria-label={label}
        >
          <ChevronsUpDown className="size-4" aria-hidden />
        </Button>
      </div>

      {open ? (
        <div
          id={`${label}-stations`}
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border bg-card p-1 shadow-soft"
        >
          {filtered.length ? (
            filtered.map((station, index) => (
              <button
                key={station.id}
                type="button"
                role="option"
                aria-selected={station.id === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseStation(station)}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-sm transition",
                  index === activeIndex && "bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {stationDisplayName(station, language)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {language === "fa" ? station.name : station.nameFa}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <LineBadges station={station} language={language} compact />
                  {station.id === value ? <Check className="size-4" aria-hidden /> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("noStation")}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
