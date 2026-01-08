import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FormShellSkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <Skeleton className="mb-2 w-48 h-6" />
          <Skeleton className="w-64 h-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-full h-10" />
            </div>
          ))}
          <Skeleton className="w-full h-11" />
        </CardContent>
      </Card>
      <div className="flex gap-4 mt-6">
        <Skeleton className="w-32 h-11" />
        <Skeleton className="flex-1 h-11" />
      </div>
    </>
  );
}

export function DashboardShellSkeleton() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-32 h-10" />
      </div>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        <Skeleton className="col-span-1 md:col-span-2 h-64" />
        <Skeleton className="col-span-1 h-64" />
      </div>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mt-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </>
  );
}

export function ResultsShellSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-5xl">
        {/* Header Skeleton */}
        <div className="mb-12 text-center">
          <div className="inline-flex justify-center items-center mb-4">
            <Skeleton className="rounded-full w-32 h-32" />
          </div>
          <Skeleton className="mx-auto mb-2 w-3/4 h-10" />
          <Skeleton className="mx-auto w-1/2 h-6" />
        </div>

        {/* Strengths Skeleton */}
        <section className="mb-12">
          <Skeleton className="mb-4 w-48 h-8" />
          <div className="gap-4 grid md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="rounded-xl h-24" />
            ))}
          </div>
        </section>

        {/* Skill Gaps Skeleton */}
        <section className="mb-12">
          <Skeleton className="mb-4 w-64 h-8" />
          <Skeleton className="mb-6 w-1/2 h-5" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="rounded-xl h-40" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
