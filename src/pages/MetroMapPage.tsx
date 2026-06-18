import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { MetroImageMap } from "@/components/map/MetroImageMap";
import { usePageSeo } from "@/hooks/usePageSeo";
import { buildDefaultMetadata } from "@/services/seo";
import { useMetroStore } from "@/store/useMetroStore";

export default function MetroMapPage() {
  const language = useMetroStore((state) => state.language);
  const theme = useMetroStore((state) => state.theme);
  const setLanguage = useMetroStore((state) => state.setLanguage);
  const setTheme = useMetroStore((state) => state.setTheme);

  usePageSeo(buildDefaultMetadata("/metro-map"));

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

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <MetroImageMap />
      </main>
    </motion.div>
  );
}
