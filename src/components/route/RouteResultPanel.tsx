import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Copy, GitFork, Share2, TrainFront } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Language, RouteResult } from "@/types/metro";
import { copyText } from "@/services/share";
import { formatNumber, listFormatter, stationDisplayName } from "@/utils/text";

type RouteResultPanelProps = {
  route: RouteResult | null;
  language: Language;
  copiedUrl: string;
};

export function RouteResultPanel({ route, language, copiedUrl }: RouteResultPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"route" | "url" | null>(null);

  const lineList = useMemo(() => {
    if (!route?.linesUsed.length) return "";
    return listFormatter(language).format(
      route.linesUsed.map((line) => t("line", { line: formatNumber(line, language) })),
    );
  }, [language, route?.linesUsed, t]);

  const copyRoute = async () => {
    if (!route) return;
    const text = [
      `${stationDisplayName(route.origin, language)} -> ${stationDisplayName(route.destination, language)}`,
      `${t("stops")}: ${formatNumber(route.stops, language)}`,
      `${t("transfers")}: ${formatNumber(route.transfers, language)}`,
      `${t("estimatedTime")}: ${formatNumber(route.estimatedMinutes, language)} ${t("minuteUnit")}`,
      route.steps.map((step) => stationDisplayName(step.station, language)).join(" -> "),
    ].join("\n");
    await copyText(text);
    setCopied("route");
    window.setTimeout(() => setCopied(null), 1200);
  };

  const copyUrl = async () => {
    await copyText(copiedUrl);
    setCopied("url");
    window.setTimeout(() => setCopied(null), 1200);
  };

  return (
    <AnimatePresence mode="wait">
      {route ? (
        <motion.section
          key={`${route.origin.id}-${route.destination.id}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.18 }}
          className="grid gap-4 lg:grid-cols-[360px_1fr]"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <SummaryRow
                  label={t("origin")}
                  value={stationDisplayName(route.origin, language)}
                />
                <SummaryRow
                  label={t("destination")}
                  value={stationDisplayName(route.destination, language)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Metric label={t("stops")} value={formatNumber(route.stops, language)} />
                <Metric label={t("transfers")} value={formatNumber(route.transfers, language)} />
                <Metric
                  label={t("estimatedTime")}
                  value={`${formatNumber(route.estimatedMinutes, language)} ${t("minuteUnit")}`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("linesUsed")}</p>
                <div className="flex flex-wrap gap-2">
                  {route.linesUsed.map((line) => {
                    const step = route.steps.find((routeStep) => routeStep.line === line);
                    return (
                      <Badge key={line}>
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: step?.color ?? "#71717a" }}
                          aria-hidden
                        />
                        {t("line", { line: formatNumber(line, language) })}
                      </Badge>
                    );
                  })}
                </div>
                {lineList ? <p className="text-xs text-muted-foreground">{lineList}</p> : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button variant="secondary" onClick={copyRoute}>
                  {copied === "route" ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copied === "route" ? t("copied") : t("copyRoute")}
                </Button>
                <Button variant="secondary" onClick={copyUrl}>
                  {copied === "url" ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Share2 className="size-4" aria-hidden />
                  )}
                  {copied === "url" ? t("copied") : t("shareRoute")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("route")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RouteTimeline route={route} language={language} />
            </CardContent>
          </Card>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const iconClass = "mx-auto mb-2 size-4 text-muted-foreground";
  return (
    <div className="min-h-24 rounded-lg border bg-background p-3 text-center">
      {label.includes("Time") || label.includes("زمان") ? (
        <Clock className={iconClass} aria-hidden />
      ) : label.includes("Transfer") || label.includes("تغییر") ? (
        <GitFork className={iconClass} aria-hidden />
      ) : (
        <TrainFront className={iconClass} aria-hidden />
      )}
      <p className="text-lg font-semibold leading-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RouteTimeline({ route, language }: { route: RouteResult; language: Language }) {
  const { t } = useTranslation();

  return (
    <ol className="space-y-0">
      {route.steps.map((step, index) => {
        const isLast = index === route.steps.length - 1;

        return (
          <motion.li
            key={`${step.station.id}-${index}`}
            className="grid grid-cols-[24px_1fr] gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.3) }}
          >
            <div className="flex flex-col items-center">
              <span
                className="mt-1 size-4 rounded-full border-2 border-card"
                style={{ backgroundColor: step.color, boxShadow: `0 0 0 2px ${step.color}` }}
              />
              {!isLast ? (
                <span className="h-10 w-0.5 flex-1" style={{ backgroundColor: step.color }} />
              ) : null}
            </div>
            <div className={isLast ? "pb-0" : "pb-5"}>
              <p className="font-medium">{stationDisplayName(step.station, language)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {step.line ? (
                  <Badge>
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                      aria-hidden
                    />
                    {t("line", { line: formatNumber(step.line, language) })}
                  </Badge>
                ) : null}
                {step.transferTo ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("changeToLine", { line: formatNumber(step.transferTo, language) })}
                  </span>
                ) : null}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
