import { Map, Moon, Route, Sun, TrainFront } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Language, ThemeMode } from "@/types/metro";
import { cn } from "@/utils/cn";

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
    <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-card shadow-panel">
          <TrainFront className="size-5" aria-hidden />
        </div>
        <span className="truncate text-sm font-semibold">{t("appName")}</span>
      </div>

      <nav className="order-3 grid w-full grid-cols-2 gap-1 rounded-lg border bg-card p-1 sm:order-none sm:w-auto">
        <HeaderLink to="/" label={t("routePlanner")}>
          <Route className="size-4" aria-hidden />
        </HeaderLink>
        <HeaderLink to="/metro-map" label={t("officialMetroMap")}>
          <Map className="size-4" aria-hidden />
        </HeaderLink>
      </nav>

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

function HeaderLink({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition sm:text-sm",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      {children}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
