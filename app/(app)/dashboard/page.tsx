import { DashboardContent } from "@/components/dashboard-content";
import { DashboardShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <PageShell variant="wide">
      <Suspense fallback={<DashboardShellSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageShell>
  );
}
