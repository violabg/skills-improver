import { analyzeSkillGap } from "@/lib/ai/analyzeSkillGap";
import db from "@/lib/db";
import { type Prisma } from "@/lib/prisma/client";
import { getExistingGapResources } from "../actions/load-gap-resources";

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

/**
 * Get assessment results with per-skill gap analysis.
 * Each skill is analyzed individually by AI for complete coverage.
 */
export async function getAssessmentResults(
  assessmentId: string,
  userId: string
): Promise<GapsData> {
  // Fetch assessment with results and existing gaps
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
    // Use existing gaps from database
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
    // Generate gaps using per-skill AI analysis
    const targetRole = assessment.targetRole || "Unknown Role";
    const gaps: GapItem[] = [];
    const strengths: string[] = [];

    // Build context summary of other skills
    const allSkillsSummary = assessment.results
      .map((r) => `${r.skill.name}: Level ${r.level}/5`)
      .join("\n");

    // Analyze each skill individually
    for (const result of assessment.results) {
      const skillGap = await analyzeSkillGap({
        skillId: result.skillId,
        skillName: result.skill.name,
        currentLevel: result.level,
        targetRole,
        skillCategory: result.skill.category as "HARD" | "SOFT" | "META",
        otherSkillsSummary: allSkillsSummary,
      });

      if (skillGap.gapSize > 0) {
        gaps.push(skillGap);
      } else {
        strengths.push(skillGap.skillName);
      }
    }

    // Sort gaps by priority (1 = highest priority)
    gaps.sort((a, b) => a.priority - b.priority);

    // Calculate readiness score
    const totalSkills = assessment.results.length;
    const skillsAtTarget = strengths.length;
    const readinessScore = Math.round((skillsAtTarget / totalSkills) * 100);

    // Generate overall recommendation
    const topGaps = gaps.slice(0, 3).map((g) => g.skillName);
    const overallRecommendation =
      gaps.length === 0
        ? `You are well-prepared for ${targetRole}! Consider advanced challenges to further develop your expertise.`
        : `Focus on ${topGaps.join(
            ", "
          )} to accelerate your transition to ${targetRole}. These ${
            topGaps.length
          } skill${
            topGaps.length > 1 ? "s" : ""
          } have the highest impact on your career progression.`;

    // Save gaps to database for future requests
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
      targetRole,
      readinessScore,
      gaps,
      strengths,
      overallRecommendation,
    };
  }

  // Load resources for all gaps with gapSize > 0
  for (const g of gapsData.gaps) {
    try {
      const result = await getExistingGapResources({
        assessmentGapId: assessmentGapsId,
        skillId: g.skillId as string,
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
