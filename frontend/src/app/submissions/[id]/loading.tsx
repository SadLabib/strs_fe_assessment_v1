import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading results" className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
