import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FormShellSkeleton() {
  return (
    <>
      <div className="gap-6 grid md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="mb-2 w-48 h-6" />
            <Skeleton className="w-64 h-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
            </div>
            <div className="gap-6 grid sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="mb-2 w-32 h-6" />
            <Skeleton className="w-48 h-4" />
          </CardHeader>
          <CardContent>
            <div className="gap-4 grid sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Skeleton className="rounded-full w-32 h-11" />
      </div>
    </>
  );
}

export function GoalSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b">
          <Skeleton className="mb-2 w-48 h-6" />
          <Skeleton className="w-64 h-4" />
        </div>
        <CardContent className="p-6">
          <div className="gap-4 grid sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="rounded-xl h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <Skeleton className="w-20 h-10" />
        <Skeleton className="rounded-full w-32 h-11" />
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex md:flex-row flex-col justify-between md:items-end gap-4 pb-6 border-border/40 border-b">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-96 h-5" />
          <Skeleton className="w-96 h-5" />
        </div>
        <Skeleton className="rounded-full w-[216px] h-[36px]" />
      </div>
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Main Content (2 cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Featured Cards */}
          <div className="gap-4 grid md:grid-cols-2">
            <Skeleton className="rounded-xl h-64" />
            <Skeleton className="rounded-xl h-64" />
          </div>
          {/* List */}
          <div className="space-y-4">
            <Skeleton className="w-48 h-7" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="rounded-xl h-24" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          <Skeleton className="rounded-xl h-48" />
          <Skeleton className="rounded-xl h-32" />
        </div>
      </div>
    </div>
  );
}

export function ResultsShellSkeleton() {
  return (
    <div>
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
  );
}
