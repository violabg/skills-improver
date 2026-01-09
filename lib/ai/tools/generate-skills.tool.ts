import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for suggesting relevant skills based on user profile.
 * Selects from existing skills database and suggests new ones when needed.
 */
export const generateSkillsTool = tool({
  description:
    "Suggest relevant skills for a user's profile and career goal. Selects 8-12 existing skills and optionally suggests 1-3 new skills if critical ones are missing.",

  inputSchema: z.object({
    currentRole: z.string().describe("User's current role"),
    targetRole: z.string().describe("User's target role/goal"),
    industry: z.string().optional().describe("User's industry"),
    yearsExperience: z
      .string()
      .optional()
      .describe("Years of experience range"),
    careerIntent: z
      .string()
      .optional()
      .describe("Career intent (GROWTH, LEADERSHIP, SWITCH)"),
    existingSkills: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          category: z.enum(["HARD", "SOFT", "META"]),
          domain: z.string().nullable(),
        })
      )
      .describe("Available skills in the database to select from"),
  }),

  execute: async ({
    currentRole,
    targetRole,
    industry,
    yearsExperience,
    careerIntent,
    existingSkills,
  }) => {
    const skillsList = existingSkills
      .map((s) => `- ${s.name} (${s.category}, ${s.domain || "General"})`)
      .join("\n");

    return {
      profile: {
        currentRole,
        targetRole,
        industry: industry || "Not specified",
        yearsExperience: yearsExperience || "Not specified",
        careerIntent: careerIntent || "Not specified",
      },
      existingSkillNames: existingSkills.map((s) => s.name),
      skillsList,
      selectionGuidelines: [
        "Select 8-12 EXISTING skills using their EXACT names",
        "Balance HARD, SOFT, and META skills",
        "Focus on testable gaps between current and target role",
        "For leadership roles, emphasize SOFT/META skills",
        "Only suggest new skills if existing ones don't cover critical needs",
      ],
      newSkillFormat: {
        name: "Skill name (e.g., 'React Native')",
        category: "HARD | SOFT | META",
        domain: "Domain (e.g., 'Mobile Development')",
        reasoning: "Why this skill is relevant",
      },
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Skill selection context prepared for "${output.profile.currentRole}" → "${output.profile.targetRole}" with ${output.existingSkillNames.length} available skills.`,
  }),
});

export type GenerateSkillsTool = typeof generateSkillsTool;
