import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { type Prisma } from "@/lib/prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface GapItem {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
  resources?: {
    courses: Array<{ title: string; url: string; provider: string }>;
    articles: Array<{ title: string; url: string }>;
    books: Array<{ title: string; author: string }>;
  };
}

export interface GapsData {
  assessmentId: string;
  assessmentGapsId: string;
  targetRole: string;
  readinessScore: number;
  gaps: GapItem[];
  strengths: string[];
  overallRecommendation: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assessmentId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 }
    );
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

    // Save gaps to database (upsert to avoid unique constraint race on assessmentId)
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

  // Enrich top priority gaps with recommended resources
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

  return NextResponse.json(gapsData);
}
