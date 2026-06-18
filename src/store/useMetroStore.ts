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

type PersistedMetroState = Pick<
  MetroState,
  "language" | "theme" | "recentRoutes" | "favoriteStationIds"
>;

const storageKey = "sharyaan-metro-navigator";
const legacyStorageKey = "tehran-metro-navigator";

migrateLegacyStorageKey();

export const useMetroStore = create<MetroState>()(
  persist(
    (set, get) => ({
      originId: null,
      destinationId: null,
      selectedStationId: null,
      language: "fa",
      theme: "dark",
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
      name: storageKey,
      version: 1,
      migrate: (persistedState): PersistedMetroState => ({
        ...(persistedState as PersistedMetroState),
        language: "fa",
        theme: "dark",
      }),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        recentRoutes: state.recentRoutes,
        favoriteStationIds: state.favoriteStationIds,
      }),
    },
  ),
);

function migrateLegacyStorageKey() {
  if (typeof window === "undefined") return;

  try {
    if (!window.localStorage.getItem(storageKey)) {
      const legacyValue = window.localStorage.getItem(legacyStorageKey);
      if (legacyValue) window.localStorage.setItem(storageKey, legacyValue);
    }
  } catch {
    // Ignore storage errors and let Zustand initialize with defaults.
  }
}
