import db from "@/lib/db";
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for fetching assessment data from the database.
 * Used by the agent to get assessment details and skill evaluation results.
 */
export const fetchAssessmentTool = tool({
  description:
    "Fetch assessment data including results and skill evaluations. Returns assessment status, target role, and all skill evaluation scores.",

  inputSchema: z.object({
    assessmentId: z.string().uuid().describe("The assessment ID to fetch"),
  }),

  execute: async ({ assessmentId }) => {
    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        results: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!assessment) {
      return {
        found: false,
        error: "Assessment not found",
      };
    }

    // Build summary for agent consumption
    const resultsSummary = assessment.results.map((r) => ({
      skillId: r.skillId,
      skillName: r.skill.name,
      category: r.skill.category,
      level: r.level,
      confidence: r.confidence,
      shouldTest: r.shouldTest,
    }));

    const skillsSummaryText = resultsSummary
      .map(
        (r) =>
          `${r.skillName} (${r.category}): Level ${r.level}/5, Confidence: ${r.confidence}`
      )
      .join("\n");

    return {
      found: true,
      id: assessment.id,
      status: assessment.status,
      targetRole: assessment.targetRole,
      currentRole: assessment.currentRole,
      industry: assessment.industry,
      results: resultsSummary,
      skillsSummaryText,
      totalSkills: resultsSummary.length,
      averageLevel:
        resultsSummary.length > 0
          ? resultsSummary.reduce((sum, r) => sum + r.level, 0) /
            resultsSummary.length
          : 0,
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: output.found
      ? `Fetched assessment for "${output.targetRole}" with ${output.totalSkills} skill results.`
      : `Assessment not found.`,
  }),
});

export type FetchAssessmentTool = typeof fetchAssessmentTool;
