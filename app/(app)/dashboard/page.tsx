import { DashboardContent } from "@/components/dashboard-content";
import { Suspense } from "react";

function DashboardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="bg-white border-slate-200 border-b">
        <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="bg-slate-200 rounded w-32 h-6 animate-pulse" />
          <div className="bg-slate-200 rounded w-20 h-10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
