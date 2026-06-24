import { useEffect, useRef, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Language } from "@/types/metro";
import { readJson, writeJson } from "@/utils/storage";

const BEST_CPS_KEY = "games.clickCounter.bestCps";
const DURATION_MS = 10_000;

type MessageKey = "intro" | "running" | "newBest" | "complete";

type CounterCopy = {
  stats: {
    clicks: string;
    cps: string;
    bestCps: string;
  };
  messages: Record<MessageKey, string>;
  buttons: {
    start: string;
    again: string;
    click: string;
  };
  seconds: (value: number) => string;
};

const copy: Record<Language, CounterCopy> = {
  en: {
    stats: {
      clicks: "Clicks",
      cps: "CPS",
      bestCps: "Best CPS",
    },
    messages: {
      intro: "Start the 10-second challenge.",
      running: "Keep clicking until the timer reaches zero.",
      newBest: "New best clicks per second.",
      complete: "Challenge complete.",
    },
    buttons: {
      start: "Start Challenge",
      again: "Play Again",
      click: "Click",
    },
    seconds: (value) => `${value}s`,
  },
  fa: {
    stats: {
      clicks: "کلیک‌ها",
      cps: "کلیک/ثانیه",
      bestCps: "بهترین کلیک/ثانیه",
    },
    messages: {
      intro: "چالش 10 ثانیه‌ای را شروع کنید.",
      running: "تا صفر شدن زمان کلیک کنید.",
      newBest: "رکورد کلیک بر ثانیه ثبت شد.",
      complete: "چالش تمام شد.",
    },
    buttons: {
      start: "شروع چالش",
      again: "دوباره بازی کنید",
      click: "کلیک",
    },
    seconds: (value) => `${value} ثانیه`,
  },
};

function formatCps(value: number | null) {
  return value === null ? "--" : value.toFixed(2);
}

export function ClickCounterChallenge({ language }: { language: Language }) {
  const text = copy[language];
  const intervalRef = useRef<number | null>(null);
  const endAtRef = useRef(0);
  const clicksRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [currentCps, setCurrentCps] = useState(0);
  const [bestCps, setBestCps] = useState<number | null>(() =>
    readJson<number | null>(BEST_CPS_KEY, null),
  );
  const [messageKey, setMessageKey] = useState<MessageKey>("intro");

  useEffect(() => clearTimer, []);

  function clearTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function updateLiveStats() {
    const elapsedMs = Math.max(1, DURATION_MS - Math.max(0, endAtRef.current - performance.now()));
    const nextCps = clicksRef.current / (elapsedMs / 1000);

    setClicks(clicksRef.current);
    setCurrentCps(nextCps);
  }

  function finishChallenge() {
    clearTimer();
    setRunning(false);
    setSecondsLeft(0);

    const finalCps = clicksRef.current / (DURATION_MS / 1000);
    setCurrentCps(finalCps);

    if (bestCps === null || finalCps > bestCps) {
      setBestCps(finalCps);
      writeJson(BEST_CPS_KEY, finalCps);
      setMessageKey("newBest");
      return;
    }

    setMessageKey("complete");
  }

  function tick() {
    const msLeft = Math.max(0, endAtRef.current - performance.now());

    setSecondsLeft(Math.ceil(msLeft / 1000));
    updateLiveStats();

    if (msLeft <= 0) {
      finishChallenge();
    }
  }

  function startChallenge() {
    clearTimer();
    clicksRef.current = 0;
    endAtRef.current = performance.now() + DURATION_MS;
    setClicks(0);
    setCurrentCps(0);
    setSecondsLeft(10);
    setRunning(true);
    setMessageKey("running");
    intervalRef.current = window.setInterval(tick, 100);
    tick();
  }

  function handleClickTarget() {
    if (!running) return;

    clicksRef.current += 1;
    updateLiveStats();
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <GameStat label={text.stats.clicks} value={String(clicks)} />
        <GameStat label={text.stats.cps} value={currentCps.toFixed(2)} />
        <GameStat label={text.stats.bestCps} value={formatCps(bestCps)} />
      </div>

      <div className="grid min-h-64 place-items-center rounded-lg border bg-muted p-5 text-center">
        <div className="grid w-full max-w-md gap-4 justify-items-center">
          <MousePointerClick className="size-9 text-violet-600" aria-hidden />
          <p className="text-4xl font-semibold tracking-normal">{text.seconds(secondsLeft)}</p>
          <p className="text-sm font-medium text-muted-foreground">{text.messages[messageKey]}</p>
          <div className="grid w-full gap-2">
            <Button variant="primary" onClick={startChallenge} disabled={running}>
              {clicks > 0 ? text.buttons.again : text.buttons.start}
            </Button>
            <Button
              className="h-24 text-base"
              variant="secondary"
              onClick={handleClickTarget}
              disabled={!running}
            >
              {text.buttons.click}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="mt-2 block text-2xl tracking-normal">{value}</strong>
    </div>
  );
}
