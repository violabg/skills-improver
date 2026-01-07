import { ResultsContent } from "@/components/assessment/results-content";
import { recommendResources } from "@/lib/ai/recommendResources";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function ResultsSkeleton() {
  return (
    <div className="bg-transparent min-h-screen">
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

  // Build gaps data using only the skills that were part of this assessment
  const resultsMap = new Map(assessment.results.map((r) => [r.skillId, r]));

  // Get only the skills that have results in this assessment
  const assessmentSkills = assessment.results.map((r) => r.skill);

  const gaps = assessmentSkills.map((skill) => {
    const result = resultsMap.get(skill.id as string);
    const currentLevel = result?.level ?? 0;
    const targetLevel = skill.difficulty ?? 3;
    const gapSize = Math.max(0, targetLevel - currentLevel);

    return {
      skillId: skill.id,
      skillName: skill.name,
      currentLevel,
      targetLevel,
      gapSize,
      impact: gapSize > 2 ? "CRITICAL" : gapSize > 1 ? "HIGH" : "MEDIUM",
      explanation: `${skill.name} is ${
        gapSize > 0 ? "required for" : "not critical for"
      } ${assessment.targetRole}`,
      recommendedActions: [
        `Focus on improving ${skill.name}`,
        `Seek mentorship or structured learning`,
      ],
      estimatedTimeWeeks: gapSize * 2,
      priority: 10 - gapSize * 2,
    };
  });

  gaps.sort((a, b) => b.priority - a.priority);

  const readinessScore = Math.round(
    ((assessmentSkills.length - gaps.filter((g) => g.gapSize > 0).length) /
      assessmentSkills.length) *
      100
  );

  const gapsData = {
    assessmentId: assessment.id,
    targetRole: assessment.targetRole,
    readinessScore,
    gaps,
    strengths: gaps.filter((g) => g.gapSize === 0).map((g) => g.skillName),
    overallRecommendation: `You are ${readinessScore}% ready for ${assessment.targetRole}. Focus on the top priorities to accelerate your transition.`,
  };

  // Enrich top priority gaps with recommended resources
  // We process them sequentially to avoid hitting model rate limits (especially TPM limits)
  // and limit to the top 5 biggest gaps to ensure a reasonable load time.
  const priorityGaps = gaps.filter((g) => g.gapSize > 0).slice(0, 5);

  for (const g of priorityGaps) {
    try {
      const recs = await recommendResources({
        skillId: g.skillId as string,
        skillName: g.skillName,
        skillCategory: "HARD",
        currentLevel: g.currentLevel,
        targetLevel: g.targetLevel,
      });

      // Map recommendation shape to the UI resource shape
      (g as any).resources = recs.map((r) => ({
        id: r.url || `${g.skillId}-${r.title}`,
        provider: r.provider,
        url: r.url,
        title: r.title,
        cost: r.cost,
        estimatedTime: Math.round((r.estimatedTimeMinutes || 0) / 60),
      }));
    } catch (err) {
      console.error("Failed to recommend resources for", g.skillName, err);
      (g as any).resources = [];
    }
  }

  return <ResultsContent gapsData={gapsData} />;
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
