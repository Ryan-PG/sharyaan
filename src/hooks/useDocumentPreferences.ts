import { useEffect } from "react";
import i18n from "@/i18n";
import { useMetroStore } from "@/store/useMetroStore";

export function useDocumentPreferences() {
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [language, theme]);
}
