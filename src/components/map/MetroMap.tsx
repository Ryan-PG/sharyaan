import { memo, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Language, RouteResult, Station } from "@/types/metro";
import { cn } from "@/utils/cn";
import { stationDisplayName } from "@/utils/text";
import { useGeographicMapLayout } from "@/components/map/useGeographicMapLayout";

type MetroMapProps = {
  stations: Station[];
  language: Language;
  originId: string | null;
  destinationId: string | null;
  selectedStationId: string | null;
  route: RouteResult | null;
  onStationClick: (stationId: string) => void;
};

type Transform = {
  x: number;
  y: number;
  scale: number;
};

const MetroMap = memo(function MetroMap({
  stations,
  language,
  originId,
  destinationId,
  selectedStationId,
  route,
  onStationClick,
}: MetroMapProps) {
  const { t } = useTranslation();
  const layout = useGeographicMapLayout(stations);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<{ id: number; x: number; y: number } | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const routeStationIds = useMemo(
    () => new Set(route?.stations.map((station) => station.id) ?? []),
    [route],
  );

  const routeEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    route?.stations.forEach((station, index) => {
      const next = route.stations[index + 1];
      if (next) keys.add([station.id, next.id].sort().join("__"));
    });
    return keys;
  }, [route]);

  const labelledStationIds = useMemo(() => {
    const ids = new Set<string>();
    for (const station of stations) {
      if (station.lines.length > 1) ids.add(station.id);
    }
    if (originId) ids.add(originId);
    if (destinationId) ids.add(destinationId);
    if (selectedStationId) ids.add(selectedStationId);
    if (hoveredStationId) ids.add(hoveredStationId);
    route?.stations.forEach((station, index) => {
      if (index === 0 || index === route.stations.length - 1 || station.lines.length > 1) {
        ids.add(station.id);
      }
    });
    return ids;
  }, [destinationId, hoveredStationId, originId, route, selectedStationId, stations]);

  const zoom = (amount: number) => {
    setTransform((current) => ({
      ...current,
      scale: clamp(current.scale + amount, 0.72, 3.4),
    }));
  };

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold">{t("mapTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("mapHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="icon" className="size-9 shadow-none" onClick={() => zoom(0.18)}>
            <Plus className="size-4" aria-label={t("zoomIn")} />
          </Button>
          <Button variant="icon" className="size-9 shadow-none" onClick={() => zoom(-0.18)}>
            <Minus className="size-4" aria-label={t("zoomOut")} />
          </Button>
          <Button
            variant="icon"
            className="size-9 shadow-none"
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          >
            <Maximize2 className="size-4" aria-label={t("resetMap")} />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative h-[560px] touch-none overflow-hidden bg-[radial-gradient(circle_at_center,_hsl(var(--muted))_0,_transparent_65%)] sm:h-[640px]",
          dragging && "cursor-grabbing",
        )}
        onPointerDown={(event) => {
          if ((event.target as Element).closest("button")) return;
          setDragging({ id: event.pointerId, x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging || dragging.id !== event.pointerId) return;
          const dx = event.clientX - dragging.x;
          const dy = event.clientY - dragging.y;
          setDragging({ id: event.pointerId, x: event.clientX, y: event.clientY });
          setTransform((current) => ({
            ...current,
            x: current.x + dx,
            y: current.y + dy,
          }));
        }}
        onPointerUp={(event) => {
          if (dragging?.id === event.pointerId) setDragging(null);
        }}
        onWheel={(event) => {
          event.preventDefault();
          zoom(event.deltaY > 0 ? -0.12 : 0.12);
        }}
      >
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label={`${t("mapTitle")} ${layout.boundsLabel}`}
        >
          <defs>
            <pattern id="offline-map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.7"
                opacity="0.42"
              />
            </pattern>
            <filter id="station-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.24" />
            </filter>
          </defs>

          <rect width={layout.width} height={layout.height} fill="hsl(var(--background))" />
          <rect width={layout.width} height={layout.height} fill="url(#offline-map-grid)" />

          <motion.g
            animate={{
              x: transform.x,
              y: transform.y,
              scale: transform.scale,
            }}
            transition={{ duration: 0.14 }}
            style={{ transformOrigin: "center" }}
          >
            <path
              d={layout.cityAreaPath}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              opacity="0.74"
            />

            <g>
              {layout.longitudeLines.map((line) => (
                <g key={line.key}>
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="5 8"
                    opacity="0.72"
                  />
                  <text
                    x={line.textX}
                    y={line.textY}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {line.label}
                  </text>
                </g>
              ))}

              {layout.latitudeLines.map((line) => (
                <g key={line.key}>
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="5 8"
                    opacity="0.72"
                  />
                  <text
                    x={line.textX}
                    y={line.textY}
                    textAnchor="start"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {line.label}
                  </text>
                </g>
              ))}
            </g>

            <g opacity={route ? 0.24 : 0.78}>
              {layout.edges.map((edge) => (
                <line
                  key={edge.key}
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={edge.color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              ))}
            </g>

            {route ? (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                {layout.edges
                  .filter((edge) => routeEdgeKeys.has(edge.key))
                  .map((edge) => (
                    <line
                      key={`route-${edge.key}`}
                      x1={edge.from.x}
                      y1={edge.from.y}
                      x2={edge.to.x}
                      y2={edge.to.y}
                      stroke={edge.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      opacity="0.92"
                    />
                  ))}
              </motion.g>
            ) : null}

            <g>
              {layout.stations.map((station) => {
                const selected =
                  station.id === selectedStationId ||
                  station.id === originId ||
                  station.id === destinationId ||
                  routeStationIds.has(station.id);
                const isInterchange = station.lines.length > 1;
                const radius = isInterchange ? 7 : 4.8;

                return (
                  <g key={station.id}>
                    <g
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer outline-none"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStationClick(station.id);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onStationClick(station.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredStationId(station.id)}
                      onMouseLeave={() => setHoveredStationId(null)}
                      aria-label={stationDisplayName(station, language)}
                    >
                      <motion.circle
                        cx={station.x}
                        cy={station.y}
                        r={selected ? radius + 2.2 : radius}
                        fill={selected ? station.colors[0] : "hsl(var(--card))"}
                        stroke={station.colors[0]}
                        strokeWidth={isInterchange ? 3 : 2.4}
                        filter="url(#station-shadow)"
                        initial={false}
                        animate={{
                          scale: station.id === selectedStationId ? 1.22 : 1,
                        }}
                        transition={{ duration: 0.16 }}
                      />
                    </g>

                    {labelledStationIds.has(station.id) ? (
                      <text
                        x={station.x + 10}
                        y={station.y - 10}
                        direction={language === "fa" ? "rtl" : "ltr"}
                        textAnchor={language === "fa" ? "end" : "start"}
                        className="fill-foreground text-[11px] font-medium"
                        paintOrder="stroke"
                        stroke="hsl(var(--background))"
                        strokeWidth="4"
                        strokeLinejoin="round"
                      >
                        {stationDisplayName(station, language)}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>

            <text
              x={layout.width - 32}
              y={36}
              textAnchor="end"
              className="fill-muted-foreground text-[11px] font-medium"
            >
              Tehran - {layout.center.latitude.toFixed(2)}N, {layout.center.longitude.toFixed(2)}E
            </text>
          </motion.g>
        </svg>
      </div>
    </section>
  );
});

export default MetroMap;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
