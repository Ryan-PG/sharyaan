import { Skeleton } from "@/components/ui/Skeleton";

export function MapSkeleton() {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-panel">
      <div className="flex items-center justify-between border-b p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-[560px] rounded-none sm:h-[640px]" />
    </section>
  );
}
