import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Language } from "@/types/metro";
import { readJson, writeJson } from "@/utils/storage";

const BEST_SCORE_KEY = "games.reactionTime.bestMs";
const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 4200;

type Phase = "idle" | "waiting" | "ready";
type MessageKey = "intro" | "waiting" | "clickNow" | "newBest" | "complete" | "tooEarly";

type ReactionCopy = {
  stats: {
    last: string;
    best: string;
    state: string;
  };
  phases: Record<Phase, string>;
  messages: Record<MessageKey, string>;
  buttons: Record<Phase, string>;
  unit: string;
};

const copy: Record<Language, ReactionCopy> = {
  en: {
    stats: {
      last: "Last",
      best: "Best",
      state: "State",
    },
    phases: {
      idle: "Ready",
      waiting: "Wait",
      ready: "Go",
    },
    messages: {
      intro: "Start a round, wait for the signal, then click.",
      waiting: "Wait. Do not click until the button changes.",
      clickNow: "Click now.",
      newBest: "New best reaction time.",
      complete: "Round complete. Try again for a faster time.",
      tooEarly: "Too early. Start again and wait for the signal.",
    },
    buttons: {
      idle: "Start Round",
      waiting: "Wait...",
      ready: "Click Now",
    },
    unit: "ms",
  },
  fa: {
    stats: {
      last: "آخرین",
      best: "بهترین",
      state: "وضعیت",
    },
    phases: {
      idle: "آماده",
      waiting: "صبر",
      ready: "شروع",
    },
    messages: {
      intro: "یک دور را شروع کنید، منتظر علامت بمانید و بعد کلیک کنید.",
      waiting: "صبر کنید. تا تغییر دکمه کلیک نکنید.",
      clickNow: "الان کلیک کنید.",
      newBest: "رکورد زمان واکنش ثبت شد.",
      complete: "دور تمام شد. برای زمان بهتر دوباره تلاش کنید.",
      tooEarly: "زود بود. دوباره شروع کنید و منتظر علامت بمانید.",
    },
    buttons: {
      idle: "شروع دور",
      waiting: "صبر...",
      ready: "الان کلیک کنید",
    },
    unit: "میلی‌ثانیه",
  },
};

function randomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function formatMs(value: number | null, unit: string) {
  return value === null ? "--" : `${value} ${unit}`;
}

export function ReactionTimeGame({ language }: { language: Language }) {
  const text = copy[language];
  const timerRef = useRef<number | null>(null);
  const readyAtRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(() =>
    readJson<number | null>(BEST_SCORE_KEY, null),
  );
  const [messageKey, setMessageKey] = useState<MessageKey>("intro");

  useEffect(() => clearTimer, []);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startRound() {
    clearTimer();
    setPhase("waiting");
    setMessageKey("waiting");

    timerRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase("ready");
      setMessageKey("clickNow");
    }, randomDelay());
  }

  function finishRound() {
    const score = Math.round(performance.now() - readyAtRef.current);

    setLastScore(score);
    setPhase("idle");

    if (bestScore === null || score < bestScore) {
      setBestScore(score);
      writeJson(BEST_SCORE_KEY, score);
      setMessageKey("newBest");
      return;
    }

    setMessageKey("complete");
  }

  function handleTargetClick() {
    if (phase === "idle") {
      startRound();
      return;
    }

    if (phase === "waiting") {
      clearTimer();
      setPhase("idle");
      setMessageKey("tooEarly");
      return;
    }

    finishRound();
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <GameStat label={text.stats.last} value={formatMs(lastScore, text.unit)} />
        <GameStat label={text.stats.best} value={formatMs(bestScore, text.unit)} />
        <GameStat label={text.stats.state} value={text.phases[phase]} />
      </div>

      <div className="grid min-h-64 place-items-center rounded-lg border bg-muted p-5 text-center">
        <div className="grid w-full max-w-md gap-4 justify-items-center">
          <Zap className="size-9 text-rose-600" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">{text.messages[messageKey]}</p>
          <Button
            className={
              phase === "ready"
                ? "h-24 w-full bg-rose-600 text-base text-white hover:opacity-95"
                : "h-24 w-full text-base"
            }
            variant={phase === "ready" ? "primary" : "secondary"}
            onClick={handleTargetClick}
          >
            {text.buttons[phase]}
          </Button>
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
