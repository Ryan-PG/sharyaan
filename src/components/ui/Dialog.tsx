import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Dialog({ open, title, onClose, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] dark:bg-black/60"
            aria-label="Close"
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="pointer-events-none fixed inset-3 z-50 grid place-items-center">
            <motion.section
              className={cn(
                "pointer-events-auto max-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-soft sm:w-[min(720px,calc(100vw-2rem))]",
                className,
              )}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
                <Button variant="icon" className="size-9 shrink-0 shadow-none" onClick={onClose}>
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-5">{children}</div>
            </motion.section>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
