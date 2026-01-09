import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for recommending learning resources to close a skill gap.
 * Returns curated resources with cost, time estimates, and relevance scores.
 */
export const recommendResourcesTool = tool({
  description:
    "Recommend 5 best learning resources (courses, books, tutorials, videos, practice platforms) to help close a skill gap. Returns resources with cost, time estimates, difficulty, and relevance scores.",

  inputSchema: z.object({
    skillId: z.string().describe("ID of the skill to find resources for"),
    skillName: z.string().describe("Name of the skill"),
    skillCategory: z
      .enum(["HARD", "SOFT", "META"])
      .describe("Category of the skill"),
    currentLevel: z
      .number()
      .min(0)
      .max(5)
      .describe("Current skill level (0-5)"),
    targetLevel: z
      .number()
      .min(0)
      .max(5)
      .describe("Target skill level to achieve (0-5)"),
    context: z
      .string()
      .optional()
      .describe("Industry or role context for more relevant recommendations"),
  }),

  execute: async ({
    skillId,
    skillName,
    skillCategory,
    currentLevel,
    targetLevel,
    context,
  }) => {
    const levelGap = targetLevel - currentLevel;
    const progressDescription =
      levelGap <= 0
        ? "Skills already at target level"
        : levelGap === 1
        ? "Minor improvement needed"
        : levelGap === 2
        ? "Moderate learning required"
        : "Significant learning effort needed";

    // Return context for the agent to generate appropriate resources
    return {
      skillId,
      skillName,
      skillCategory,
      currentLevel,
      targetLevel,
      levelGap,
      progressDescription,
      context: context || "General",
      resourceTypes: [
        "COURSE",
        "VIDEO",
        "ARTICLE",
        "BOOK",
        "TUTORIAL",
        "PRACTICE",
      ],
      costCategories: ["FREE", "FREEMIUM", "PAID"],
      recommendedProviders: [
        "Coursera, edX, Udemy (structured courses)",
        "YouTube, Dev.to, Medium (articles/tutorials)",
        "Codecademy, LeetCode, HackerRank (practice)",
        "FreeCodeCamp, Khan Academy (free structured)",
        "LinkedIn Learning (professional development)",
        "O'Reilly Books (deep dives)",
      ],
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Resource search context prepared for "${output.skillName}": ${output.progressDescription} (gap: ${output.levelGap} levels).`,
  }),
});

export type RecommendResourcesTool = typeof recommendResourcesTool;
