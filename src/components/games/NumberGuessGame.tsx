import { FormEvent, useState } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Language } from "@/types/metro";

type HintKey = "ready" | "check" | "solved" | "higher" | "lower";
type MessageState =
  | { key: "intro" | "newNumber" | "invalid" | "higher" | "lower" }
  | { key: "correct"; attempts: number };

type GuessCopy = {
  stats: {
    range: string;
    attempts: string;
    hint: string;
  };
  hints: Record<HintKey, string>;
  messages: {
    intro: string;
    newNumber: string;
    invalid: string;
    higher: string;
    lower: string;
    correct: (attempts: number) => string;
  };
  placeholder: string;
  submit: string;
  reset: string;
};

const copy: Record<Language, GuessCopy> = {
  en: {
    stats: {
      range: "Range",
      attempts: "Attempts",
      hint: "Hint",
    },
    hints: {
      ready: "Ready",
      check: "Check",
      solved: "Solved",
      higher: "Higher",
      lower: "Lower",
    },
    messages: {
      intro: "Guess a whole number from 1 to 100.",
      newNumber: "A new number is ready.",
      invalid: "Enter a whole number from 1 to 100.",
      higher: "Try a higher number.",
      lower: "Try a lower number.",
      correct: (attempts) => `Correct in ${attempts} ${attempts === 1 ? "attempt" : "attempts"}.`,
    },
    placeholder: "Your guess",
    submit: "Guess",
    reset: "New Number",
  },
  fa: {
    stats: {
      range: "بازه",
      attempts: "تلاش‌ها",
      hint: "راهنما",
    },
    hints: {
      ready: "آماده",
      check: "بررسی",
      solved: "درست",
      higher: "بالاتر",
      lower: "پایین‌تر",
    },
    messages: {
      intro: "یک عدد صحیح از 1 تا 100 حدس بزنید.",
      newNumber: "عدد جدید آماده است.",
      invalid: "یک عدد صحیح از 1 تا 100 وارد کنید.",
      higher: "عدد بالاتری را امتحان کنید.",
      lower: "عدد پایین‌تری را امتحان کنید.",
      correct: (attempts) => `در ${attempts} تلاش درست حدس زدید.`,
    },
    placeholder: "حدس شما",
    submit: "حدس",
    reset: "عدد جدید",
  },
};

function createSecretNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

function getMessage(text: GuessCopy, message: MessageState) {
  if (message.key === "correct") {
    return text.messages.correct(message.attempts);
  }

  return text.messages[message.key];
}

export function NumberGuessGame({ language }: { language: Language }) {
  const text = copy[language];
  const [secretNumber, setSecretNumber] = useState(createSecretNumber);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintKey, setHintKey] = useState<HintKey>("ready");
  const [message, setMessage] = useState<MessageState>({ key: "intro" });
  const [solved, setSolved] = useState(false);

  function resetGame() {
    setSecretNumber(createSecretNumber());
    setGuess("");
    setAttempts(0);
    setHintKey("ready");
    setMessage({ key: "newNumber" });
    setSolved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number(guess);

    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setHintKey("check");
      setMessage({ key: "invalid" });
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (value === secretNumber) {
      setHintKey("solved");
      setMessage({ key: "correct", attempts: nextAttempts });
      setSolved(true);
      return;
    }

    if (value < secretNumber) {
      setHintKey("higher");
      setMessage({ key: "higher" });
      return;
    }

    setHintKey("lower");
    setMessage({ key: "lower" });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <GameStat label={text.stats.range} value="1-100" />
        <GameStat label={text.stats.attempts} value={String(attempts)} />
        <GameStat label={text.stats.hint} value={text.hints[hintKey]} />
      </div>

      <div className="grid min-h-64 place-items-center rounded-lg border bg-muted p-5 text-center">
        <form className="grid w-full max-w-md gap-4 justify-items-center" onSubmit={handleSubmit}>
          <Hash className="size-9 text-teal-600" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">{getMessage(text, message)}</p>
          <div className="flex w-full gap-2 max-sm:flex-col">
            <Input
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              type="number"
              min={1}
              max={100}
              step={1}
              inputMode="numeric"
              placeholder={text.placeholder}
              disabled={solved}
              aria-label={text.placeholder}
            />
            <Button type="submit" variant="primary" disabled={solved}>
              {text.submit}
            </Button>
          </div>
          <Button type="button" variant="secondary" onClick={resetGame}>
            {text.reset}
          </Button>
        </form>
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
