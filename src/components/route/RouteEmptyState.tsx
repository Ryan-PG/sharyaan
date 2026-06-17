import { MapPinned } from "lucide-react";
import { motion } from "framer-motion";

type RouteEmptyStateProps = {
  message: string;
};

export function RouteEmptyState({ message }: RouteEmptyStateProps) {
  return (
    <motion.div
      className="rounded-lg border bg-card p-8 text-center shadow-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
    >
      <MapPinned className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
}
