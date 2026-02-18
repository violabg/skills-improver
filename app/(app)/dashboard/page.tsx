import { DashboardContent } from "@/components/dashboard-content";
import { DashboardShellSkeleton } from "@/components/skeletons";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function DashboardPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  const dashboardData = await getDashboardData(session.user.id);

  return <DashboardContent data={dashboardData} />;
}

export default function DashboardPage() {
  return (
    <div className="mx-auto px-4 sm:px-6 py-8 md:py-12 w-full max-w-7xl min-h-[calc(100vh-4rem)]">
      <Suspense fallback={<DashboardShellSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
