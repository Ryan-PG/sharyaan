import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ open, title, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] dark:bg-black/40"
            aria-label="Close"
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className={cn(
              "fixed inset-x-3 bottom-3 z-50 rounded-lg border bg-card p-5 shadow-soft",
              "sm:inset-x-auto sm:bottom-4 sm:top-4 sm:w-[360px]",
              "ltr:sm:right-4 rtl:sm:left-4",
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 18, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <Button variant="icon" className="size-9 shadow-none" onClick={onClose}>
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
