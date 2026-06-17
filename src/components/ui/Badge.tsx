import * as React from "react";
import { cn } from "@/utils/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}
