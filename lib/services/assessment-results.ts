import db from "@/lib/db";
import { type Prisma } from "@/lib/prisma/client";
import { loadGapResources } from "../actions/load-gap-resources";

export interface GapItem {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: string;
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
  resources?: Array<{
    id: string;
    provider: string;
    url: string;
    title?: string | null;
    cost?: string | null;
    estimatedTime?: number | null;
  }>;
  evidence?: Array<{
    id: string;
    provider?: string | null;
    referenceUrl?: string | null;
    signals?: unknown;
    createdAt?: string;
  }>;
}

export interface GapsData {
  assessmentId: string;
  assessmentGapsId: string;
  targetRole?: string | null;
  readinessScore: number;
  gaps: GapItem[];
  strengths: string[];
  overallRecommendation: string | null;
}

export async function getAssessmentResults(
  assessmentId: string,
  userId: string
): Promise<GapsData> {
  // Fetch assessment results via database
  const assessment = await db.assessment.findFirst({
    where: {
      id: assessmentId,
      userId: userId,
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
    throw new Error("Assessment not found");
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
      targetRole: assessment.targetRole || "Unknown Role",
      readinessScore: assessment.gaps.readinessScore,
      gaps: assessment.gaps.gaps as unknown as GapItem[],
      strengths: assessment.gaps.strengths,
      overallRecommendation:
        assessment.gaps.overallRecommendation || "No recommendation available.",
    };
  } else {
    // Generate gaps if they don't exist
    const resultsMap = new Map(assessment.results.map((r) => [r.skillId, r]));
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
    const savedGaps = await db.assessmentGaps.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        readinessScore,
        gaps: gaps as unknown as Prisma.InputJsonValue,
        strengths,
        overallRecommendation,
      },
      update: {
        readinessScore,
        gaps: gaps as unknown as Prisma.InputJsonValue,
        strengths,
        overallRecommendation,
      },
    });

    assessmentGapsId = savedGaps.id;

    gapsData = {
      assessmentId: assessment.id,
      assessmentGapsId: savedGaps.id,
      targetRole: assessment.targetRole || "Unknown Role",
      readinessScore,
      gaps,
      strengths,
      overallRecommendation,
    };
  }

  // Load resources for all gaps with gapSize > 0
  const gapsWithDeficit = gapsData.gaps.filter((g) => g.gapSize > 0);

  for (const g of gapsWithDeficit) {
    try {
      const result = await loadGapResources({
        assessmentGapId: assessmentGapsId,
        skillId: g.skillId as string,
        skillName: g.skillName,
        currentLevel: g.currentLevel,
        targetLevel: g.targetLevel,
      });

      if (result.success) {
        g.resources = result.resources;
      }
    } catch (err) {
      console.error("Failed to load resources for", g.skillName, err);
    }
  }

  return gapsData;
}
