import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for analyzing skill gaps for a career transition.
 * Provides comprehensive gap analysis with priorities and recommendations.
 */
export const analyzeGapsTool = tool({
  description:
    "Analyze skill gaps for a career transition. Identifies critical gaps, calculates readiness score, and provides strategic recommendations for the target role.",

  inputSchema: z.object({
    targetRole: z
      .string()
      .describe("The target role the user is transitioning to"),
    assessmentSummary: z
      .string()
      .describe("Summary of the user's current skill levels from assessment"),
    skillsInfo: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          category: z.enum(["HARD", "SOFT", "META"]),
          currentLevel: z.number().min(0).max(5),
          difficulty: z.number().optional(),
        })
      )
      .describe("Array of skills with their assessed levels"),
    context: z
      .string()
      .optional()
      .describe(
        "Additional context like industry, years of experience, or career intent"
      ),
  }),

  execute: async ({ targetRole, assessmentSummary, skillsInfo, context }) => {
    // Prepare analysis context for the agent
    const skillsSummary = skillsInfo
      .map(
        (s) =>
          `- ${s.name} (${s.category}): Level ${
            s.currentLevel
          }/5, Difficulty: ${s.difficulty ?? "N/A"}`
      )
      .join("\n");

    return {
      targetRole,
      assessmentSummary,
      skillsInfo,
      skillsSummary,
      context: context || "Not specified",
      analysisGuidelines: {
        impactLevels: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        evaluationCriteria: {
          HARD: "Technical competence and tooling knowledge",
          SOFT: "Communication, leadership, collaboration",
          META: "Learning ability, adaptability, self-awareness",
        },
        focusAreas: [
          "Identify 5 most critical gaps for success",
          "Rank gaps by impact on career progression, not just size",
          "Provide actionable recommendations for each gap",
          "Calculate overall readiness percentage (0-100)",
        ],
      },
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Gap analysis context prepared for "${output.targetRole}" with ${output.skillsInfo.length} skills to analyze.`,
  }),
});

export type AnalyzeGapsTool = typeof analyzeGapsTool;
