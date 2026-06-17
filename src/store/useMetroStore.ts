import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, ThemeMode } from "@/types/metro";

type MetroState = {
  originId: string | null;
  destinationId: string | null;
  selectedStationId: string | null;
  language: Language;
  theme: ThemeMode;
  recentRoutes: Array<{ originId: string; destinationId: string; createdAt: number }>;
  favoriteStationIds: string[];
  setOrigin: (id: string | null) => void;
  setDestination: (id: string | null) => void;
  setSelectedStation: (id: string | null) => void;
  swapStations: () => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  addRecentRoute: (originId: string, destinationId: string) => void;
  toggleFavorite: (stationId: string) => void;
};

export const useMetroStore = create<MetroState>()(
  persist(
    (set, get) => ({
      originId: null,
      destinationId: null,
      selectedStationId: null,
      language: "en",
      theme: "light",
      recentRoutes: [],
      favoriteStationIds: [],
      setOrigin: (id) => set({ originId: id }),
      setDestination: (id) => set({ destinationId: id }),
      setSelectedStation: (id) => set({ selectedStationId: id }),
      swapStations: () =>
        set((state) => ({
          originId: state.destinationId,
          destinationId: state.originId,
        })),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      addRecentRoute: (originId, destinationId) => {
        const route = { originId, destinationId, createdAt: Date.now() };
        const withoutDuplicate = get().recentRoutes.filter(
          (recent) => recent.originId !== originId || recent.destinationId !== destinationId,
        );
        set({ recentRoutes: [route, ...withoutDuplicate].slice(0, 6) });
      },
      toggleFavorite: (stationId) => {
        const favorites = get().favoriteStationIds;
        set({
          favoriteStationIds: favorites.includes(stationId)
            ? favorites.filter((id) => id !== stationId)
            : [stationId, ...favorites].slice(0, 24),
        });
      },
    }),
    {
      name: "tehran-metro-navigator",
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        recentRoutes: state.recentRoutes,
        favoriteStationIds: state.favoriteStationIds,
      }),
    },
  ),
);
