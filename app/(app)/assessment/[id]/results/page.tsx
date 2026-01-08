import { ResultsContent } from "@/components/assessment/results-content";
import { ResultsShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { auth } from "@/lib/auth";
import { getAssessmentResults } from "@/lib/services/assessment-results";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AssessmentResultsContainer({ id }: { id: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?redirect=/assessment/${id}/results`);
  }

  let gapsData;
  try {
    gapsData = await getAssessmentResults(id, session.user.id);
  } catch (error) {
    console.error("Failed to load results:", error);
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-600">
          Failed to load results. Please try again.
        </p>
        <a href="/assessment/start" className="text-primary hover:underline">
          Start New Assessment
        </a>
      </div>
    );
  }

  return <ResultsContent gapsData={gapsData} />;
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell variant="default">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 7 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Your Skill Gap Report
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your personalized skill analysis and recommended learning
          path
        </p>
      </div>

      <Suspense fallback={<ResultsShellSkeleton />}>
        <AssessmentResultsContainer id={id} />
      </Suspense>
    </PageShell>
  );
}
