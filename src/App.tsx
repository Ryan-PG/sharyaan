import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useDocumentPreferences } from "@/hooks/useDocumentPreferences";
import HomePage from "@/pages/HomePage";
import MetroMapPage from "@/pages/MetroMapPage";
import StationsPage from "@/pages/StationsPage";

export default function App() {
  useDocumentPreferences();

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metro-map" element={<MetroMapPage />} />
          <Route path="/stations" element={<StationsPage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
