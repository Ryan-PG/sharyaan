import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { useDocumentPreferences } from "@/hooks/useDocumentPreferences";
import GamesPage from "@/pages/GamesPage";
import HomePage from "@/pages/HomePage";
import LinePage from "@/pages/LinePage";
import MetroMapPage from "@/pages/MetroMapPage";
import StationPage from "@/pages/StationPage";
import StationsPage from "@/pages/StationsPage";

export default function App() {
  useDocumentPreferences();

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metro-map" element={<MetroMapPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/stations/:slug" element={<StationPage />} />
          <Route path="/lines/:lineId" element={<LinePage />} />
        </Routes>
      </AnimatePresence>
      <FeedbackWidget />
    </BrowserRouter>
  );
}
