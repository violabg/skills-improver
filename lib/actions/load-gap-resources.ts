"use server";

import { recommendResources } from "@/lib/ai/recommendResources";
import db from "@/lib/db";
import { type GapItem } from "@/types";
import { cacheLife, cacheTag, updateTag } from "next/cache";

/**
 * Retrieve existing resources from database only (no generation).
 * Used for page load to show cached resources.
 * Cached for ~1 hour since resources don't change frequently.
 */
export async function getExistingGapResources({
  assessmentGapId,
  skillId,
}: {
  assessmentGapId: string;
  skillId: string;
}) {
  "use cache";
  cacheLife("hours");
  cacheTag(`gap-resources-${assessmentGapId}`, `gap-skill-${skillId}`);

  try {
    const existingResources = await db.gapResources.findUnique({
      where: {
        assessmentGapId_skillId: {
          assessmentGapId,
          skillId,
        },
      },
    });

    if (existingResources) {
      return {
        success: true,
        resources: existingResources.resources as NonNullable<
          GapItem["resources"]
        >,
      };
    }

    return {
      success: true,
      resources: [],
    };
  } catch (error) {
    console.error("Failed to get existing resources:", error);
    return {
      success: false,
      resources: [],
    };
  }
}

/**
 * Generate new resources using AI and save to database.
 * Used when user clicks "Generate Resources" button.
 * Invalidates the cache after saving.
 */
export async function loadGapResources({
  assessmentGapId,
  skillId,
  skillName,
  skillCategory = "HARD",
  currentLevel,
  targetLevel,
}: {
  assessmentGapId: string;
  skillId: string;
  skillName: string;
  skillCategory?: "HARD" | "SOFT" | "META";
  currentLevel: number;
  targetLevel: number;
}) {
  try {
    // Generate new resources using AI
    const recs = await recommendResources({
      skillId,
      skillName,
      skillCategory,
      currentLevel,
      targetLevel,
    });

    // Map to UI format (estimatedTime is in hours for display)
    const mappedResources = recs.map((r) => ({
      id: r.url || `${skillId}-${r.title}`,
      provider: r.provider,
      url: r.url,
      title: r.title,
      cost: r.cost,
      estimatedTime: Math.round((r.estimatedTimeMinutes || 0) / 60),
    }));

    // Save to database (upsert to handle regeneration)
    await db.gapResources.upsert({
      where: {
        assessmentGapId_skillId: {
          assessmentGapId,
          skillId,
        },
      },
      create: {
        assessmentGapId,
        skillId,
        skillName,
        resources: mappedResources,
      },
      update: {
        resources: mappedResources,
      },
    });

    // Invalidate cache for this gap's resources
    updateTag(`gap-resources-${assessmentGapId}`);
    updateTag(`gap-skill-${skillId}`);

    return {
      success: true,
      resources: mappedResources,
    };
  } catch (error) {
    console.error("Failed to generate gap resources for", skillName, error);
    return {
      success: false,
      resources: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
