import { useEffect } from "react";

type KeyboardShortcuts = {
  onSearch: () => void;
  onSwap: () => void;
  onFindRoute: () => void;
};

export function useKeyboardShortcuts({ onSearch, onSwap, onFindRoute }: KeyboardShortcuts) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !typing) {
        event.preventDefault();
        onSearch();
      }

      if (event.key.toLocaleLowerCase() === "s" && !typing) {
        event.preventDefault();
        onSwap();
      }

      if (event.key === "Enter" && !typing) {
        onFindRoute();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFindRoute, onSearch, onSwap]);
}
