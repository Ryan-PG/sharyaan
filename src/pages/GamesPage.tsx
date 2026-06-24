import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Gamepad2, Hash, MousePointerClick, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { ClickCounterChallenge } from "@/components/games/ClickCounterChallenge";
import { NumberGuessGame } from "@/components/games/NumberGuessGame";
import { ReactionTimeGame } from "@/components/games/ReactionTimeGame";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePageSeo } from "@/hooks/usePageSeo";
import { buildDefaultMetadata } from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";
import type { Language } from "@/types/metro";
import { cn } from "@/utils/cn";

type GameId = "reaction" | "guess" | "counter";
type GameProps = { language: Language };

type GameDefinition = {
  id: GameId;
  icon: typeof Gamepad2;
  accent: string;
  component: ComponentType<GameProps>;
};

const games: GameDefinition[] = [
  {
    id: "reaction",
    icon: Zap,
    accent: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    component: ReactionTimeGame,
  },
  {
    id: "guess",
    icon: Hash,
    accent: "text-teal-600 bg-teal-500/10 border-teal-500/20",
    component: NumberGuessGame,
  },
  {
    id: "counter",
    icon: MousePointerClick,
    accent: "text-violet-600 bg-violet-500/10 border-violet-500/20",
    component: ClickCounterChallenge,
  },
];

const pageCopy: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    play: string;
    nowPlaying: string;
    galleryLabel: string;
  }
> = {
  en: {
    eyebrow: "Entertainment hub",
    title: "Games",
    subtitle: "Quick browser games that run fully on your device.",
    play: "Play",
    nowPlaying: "Now playing",
    galleryLabel: "Games gallery",
  },
  fa: {
    eyebrow: "سرگرمی",
    title: "بازی‌ها",
    subtitle: "چند بازی سریع که کاملا در مرورگر شما اجرا می‌شوند.",
    play: "اجرا",
    nowPlaying: "در حال اجرا",
    galleryLabel: "فهرست بازی‌ها",
  },
};

const gameCopy: Record<
  Language,
  Record<GameId, { title: string; tag: string; description: string }>
> = {
  en: {
    reaction: {
      title: "Reaction Time",
      tag: "Reflex",
      description: "Wait for the signal and click as fast as possible.",
    },
    guess: {
      title: "Number Guess",
      tag: "Logic",
      description: "Find a hidden number from 1 to 100 with higher/lower hints.",
    },
    counter: {
      title: "Click Counter",
      tag: "Speed",
      description: "Click for 10 seconds and track your clicks per second.",
    },
  },
  fa: {
    reaction: {
      title: "زمان واکنش",
      tag: "واکنش",
      description: "منتظر علامت بمانید و بعد تا جای ممکن سریع کلیک کنید.",
    },
    guess: {
      title: "حدس عدد",
      tag: "منطق",
      description: "عدد پنهان 1 تا 100 را با راهنمایی بالاتر یا پایین‌تر پیدا کنید.",
    },
    counter: {
      title: "شمارنده کلیک",
      tag: "سرعت",
      description: "10 ثانیه کلیک کنید و سرعت کلیک خود را ببینید.",
    },
  },
};

export default function GamesPage() {
  const [activeGameId, setActiveGameId] = useState<GameId>("reaction");
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);
  const text = pageCopy[language];
  const localizedGames = gameCopy[language];

  usePageSeo(buildDefaultMetadata("/games"));

  const activeGame = useMemo(
    () => games.find((game) => game.id === activeGameId) ?? games[0],
    [activeGameId],
  );
  const activeText = localizedGames[activeGame.id];
  const ActiveGame = activeGame.component;

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader
        language={language}
        theme={theme}
        onLanguageChange={setLanguage}
        onThemeChange={setTheme}
      />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-3">
          <Badge className="w-fit bg-card">
            <Gamepad2 className="size-3.5" aria-hidden />
            {text.eyebrow}
          </Badge>
          <div className="grid gap-3">
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{text.title}</h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{text.subtitle}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label={text.galleryLabel}>
          {games.map((game) => {
            const Icon = game.icon;
            const isActive = game.id === activeGameId;
            const gameText = localizedGames[game.id];

            return (
              <Card
                key={game.id}
                className={cn(
                  "grid min-h-72 cursor-pointer content-between overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft",
                  isActive && "border-foreground/30 ring-2 ring-foreground/10",
                )}
                onClick={() => setActiveGameId(game.id)}
              >
                <CardHeader>
                  <div
                    className={cn(
                      "mb-4 grid h-28 place-items-center rounded-lg border",
                      game.accent,
                    )}
                  >
                    <Icon className="size-10" aria-hidden />
                  </div>
                  <Badge className="w-fit">{gameText.tag}</Badge>
                  <CardTitle>{gameText.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm text-muted-foreground">{gameText.description}</p>
                  <Button
                    variant={isActive ? "primary" : "secondary"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveGameId(game.id);
                    }}
                  >
                    <Gamepad2 className="size-4" aria-hidden />
                    {text.play}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-panel sm:p-5" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                {text.nowPlaying}
              </p>
              <h2 className="text-2xl font-semibold tracking-normal">{activeText.title}</h2>
            </div>
            <Badge className={cn("bg-background", activeGame.accent)}>{activeText.tag}</Badge>
          </div>
          <ActiveGame language={language} />
        </section>
      </main>
    </motion.div>
  );
}
