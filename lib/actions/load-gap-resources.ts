"use server";

import { recommendResources } from "@/lib/ai/recommendResources";
import db from "@/lib/db";

export async function loadGapResources({
  assessmentGapId,
  skillId,
  skillName,
  currentLevel,
  targetLevel,
}: {
  assessmentGapId: string;
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
}) {
  try {
    // Check if resources already exist for this gap
    const existingResources = await db.gapResources.findUnique({
      where: {
        assessmentGapId_skillId: {
          assessmentGapId,
          skillId,
        },
      },
    });

    if (existingResources) {
      // Return cached resources
      return {
        success: true,
        resources: existingResources.resources as any[],
        cached: true,
      };
    }

    // Generate new resources using AI
    const recs = await recommendResources({
      skillId,
      skillName,
      skillCategory: "HARD",
      currentLevel,
      targetLevel,
    });

    // Map to UI format
    const mappedResources = recs.map((r) => ({
      id: r.url || `${skillId}-${r.title}`,
      provider: r.provider,
      url: r.url,
      title: r.title,
      cost: r.cost,
      estimatedTime: Math.round((r.estimatedTimeMinutes || 0) / 60),
    }));

    // Save to database
    await db.gapResources.create({
      data: {
        assessmentGapId,
        skillId,
        skillName,
        resources: mappedResources as any,
      },
    });

    return {
      success: true,
      resources: mappedResources,
      cached: false,
    };
  } catch (error) {
    console.error("Failed to load gap resources for", skillName, error);
    return {
      success: false,
      resources: [],
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
