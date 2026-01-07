import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function FormShellSkeleton() {
  return (
    <PageShell variant="narrow">
      <div className="space-y-2 mb-8">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-96 h-4" />
      </div>
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
    </PageShell>
  );
}

export function DashboardShellSkeleton() {
  return (
    <PageShell variant="wide">
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
    </PageShell>
  );
}

export function ResultsShellSkeleton() {
  return (
    <PageShell variant="default">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-96 h-4" />
        </div>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Skeleton className="col-span-1 md:col-span-2 h-96" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
