import { Moon, Sun, TrainFront } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Language, ThemeMode } from "@/types/metro";

type AppHeaderProps = {
  language: Language;
  theme: ThemeMode;
  onLanguageChange: (language: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
};

export function AppHeader({
  language,
  theme,
  onLanguageChange,
  onThemeChange,
}: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-card shadow-panel">
          <TrainFront className="size-5" aria-hidden />
        </div>
        <span className="truncate text-sm font-semibold">{t("appName")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SegmentedControl<Language>
          label={t("language")}
          value={language}
          onChange={onLanguageChange}
          options={[
            { value: "en", label: "EN" },
            { value: "fa", label: "فا" },
          ]}
        />
        <Button
          variant="icon"
          className="size-10 shadow-none"
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          aria-label={t("theme")}
        >
          {theme === "dark" ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Moon className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </header>
  );
}
