import { ResultsContent } from "@/components/assessment/results-content";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
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

async function ResultsPageContent({ assessmentId }: { assessmentId: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/results");
  }

  // Fetch assessment results via database
  const assessment = await db.assessment.findFirst({
    where: {
      id: assessmentId,
      userId: session.user.id,
    },
    include: {
      results: {
        include: {
          skill: true,
        },
      },
    },
  });

  if (!assessment) {
    redirect("/assessment/start");
  }

  return <ResultsContent assessment={assessment} />;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  const params = await searchParams;
  const assessmentId = params.assessmentId;

  if (!assessmentId) {
    return redirect("/assessment/start");
  }

  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsPageContent assessmentId={assessmentId} />
    </Suspense>
  );
}
