import { ResultsContent } from "@/components/assessment/results-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function ResultsSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-6">
          <div className="bg-muted rounded w-64 h-12 animate-pulse" />
          <div className="bg-muted rounded h-screen animate-pulse" />
        </div>
      </div>
    </div>
  );
}

async function ResultsPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/results");
  }

  // TODO: Fetch assessment results via oRPC
  // const results = await orpc.assessment.getResults.query()

  return <ResultsContent />;
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsPageContent />
    </Suspense>
  );
}
