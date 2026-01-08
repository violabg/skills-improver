import {
  ResultsContent,
  type GapItem,
  type GapsData,
} from "@/components/assessment/results-content";
import { ResultsShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { type Prisma } from "@/lib/prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
      gaps: true,
    },
  });

  if (!assessment) {
    redirect("/assessment/start");
  }

  let gapsData: GapsData;
  let assessmentGapsId: string;

  // Check if gaps already exist in database
  if (assessment.gaps) {
    // Retrieve existing gaps from database
    assessmentGapsId = assessment.gaps.id;
    gapsData = {
      assessmentId: assessment.id,
      assessmentGapsId: assessment.gaps.id,
      targetRole: assessment.targetRole,
      readinessScore: assessment.gaps.readinessScore,
      gaps: assessment.gaps.gaps as unknown as GapItem[],
      strengths: assessment.gaps.strengths,
      overallRecommendation: assessment.gaps.overallRecommendation,
    };
  } else {
    // Generate gaps if they don't exist
    // Build gaps data using only the skills that were part of this assessment
    const resultsMap = new Map(assessment.results.map((r) => [r.skillId, r]));

    // Get only the skills that have results in this assessment
    const assessmentSkills = assessment.results.map((r) => r.skill);

    const gaps: GapItem[] = assessmentSkills.map((skill) => {
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

    const strengths = gaps
      .filter((g) => g.gapSize === 0)
      .map((g) => g.skillName);
    const overallRecommendation = `You are ${readinessScore}% ready for ${assessment.targetRole}. Focus on the top priorities to accelerate your transition.`;

    // Save gaps to database
    const savedGaps = await db.assessmentGaps.create({
      data: {
        assessmentId: assessment.id,
        readinessScore,
        gaps: gaps as unknown as Prisma.InputJsonValue, // Prisma Json needs serialization-compatible type
        strengths,
        overallRecommendation,
      },
    });

    assessmentGapsId = savedGaps.id;

    gapsData = {
      assessmentId: assessment.id,
      assessmentGapsId: savedGaps.id,
      targetRole: assessment.targetRole,
      readinessScore,
      gaps,
      strengths,
      overallRecommendation,
    };
  }

  // Enrich top priority gaps with recommended resources
  // We process them sequentially to avoid hitting model rate limits (especially TPM limits)
  // and limit to the top 5 biggest gaps to ensure a reasonable load time.
  const priorityGaps = gapsData.gaps.filter((g) => g.gapSize > 0).slice(0, 5);

  for (const g of priorityGaps) {
    try {
      // Try to load existing resources from database
      const existingResources = await db.gapResources.findUnique({
        where: {
          assessmentGapId_skillId: {
            assessmentGapId: assessmentGapsId,
            skillId: g.skillId as string,
          },
        },
      });

      if (existingResources) {
        g.resources = existingResources.resources as GapItem["resources"];
      }
    } catch (err) {
      console.error("Failed to load resources for", g.skillName, err);
    }
  }

  return (
    <PageShell variant="default">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 7 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Your Skill Gap Report
        </h1>
        <p className="text-muted-foreground">
          Here's your personalized skill analysis and recommended learning path
        </p>
      </div>
      <ResultsContent gapsData={gapsData} />
    </PageShell>
  );
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
    <Suspense fallback={<ResultsShellSkeleton />}>
      <ResultsPageContent assessmentId={assessmentId} />
    </Suspense>
  );
}
