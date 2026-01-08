import { DashboardContent } from "@/components/dashboard-content";
import { DashboardShellSkeleton } from "@/components/skeletons";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="mx-auto px-4 sm:px-6 py-8 md:py-12 w-full max-w-7xl min-h-[calc(100vh-4rem)]">
      <Suspense fallback={<DashboardShellSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
