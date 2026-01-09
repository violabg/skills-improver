import { GapAnalysisProgress } from "@/components/assessment/gap-analysis-progress";
import { ResultsContent } from "@/components/assessment/results-content";
import { ResultsShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { getExistingGapResources } from "@/lib/actions/load-gap-resources";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import type { GapItem, GapsData } from "@/lib/services/assessment-results";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface ResultsContainerProps {
  id: string;
  userId: string;
}

async function AssessmentResultsContainer({
  id,
  userId,
}: ResultsContainerProps) {
  // Check if gaps already exist
  const assessment = await db.assessment.findFirst({
    where: { id, userId },
    include: {
      results: { include: { skill: true } },
      gaps: true,
    },
  });

  if (!assessment) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-600">Assessment not found.</p>
        <a href="/assessment/start" className="text-primary hover:underline">
          Start New Assessment
        </a>
      </div>
    );
  }

  // If gaps exist, show results directly
  if (assessment.gaps) {
    const gapsData: GapsData = {
      assessmentId: assessment.id,
      assessmentGapsId: assessment.gaps.id,
      targetRole: assessment.targetRole,
      readinessScore: assessment.gaps.readinessScore,
      gaps: assessment.gaps.gaps as unknown as GapItem[],
      strengths: assessment.gaps.strengths,
      overallRecommendation: assessment.gaps.overallRecommendation,
    };

    // Load resources for gaps
    for (const g of gapsData.gaps) {
      try {
        const result = await getExistingGapResources({
          assessmentGapId: assessment.gaps.id,
          skillId: g.skillId,
        });
        if (result.success) {
          g.resources = result.resources;
        }
      } catch {
        // Ignore resource loading errors
      }
    }

    return <ResultsContent gapsData={gapsData} />;
  }

  // If no gaps, show progress UI for analysis
  const skillsToAnalyze = assessment.results.map((r) => ({
    skillId: r.skillId,
    skillName: r.skill.name,
    currentLevel: r.level,
    category: r.skill.category as "HARD" | "SOFT" | "META",
  }));

  return (
    <GapAnalysisProgress
      skillsToAnalyze={skillsToAnalyze}
      targetRole={assessment.targetRole || "Unknown Role"}
    />
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?redirect=/assessment/${id}/results`);
  }

  return (
    <PageShell
      currentStep={6}
      totalSteps={6}
      title="Your Skill Gap Report"
      description="Here's your personalized skill analysis and recommended learning path"
      variant="default"
    >
      <Suspense fallback={<ResultsShellSkeleton />}>
        <AssessmentResultsContainer id={id} userId={session.user.id} />
      </Suspense>
    </PageShell>
  );
}
