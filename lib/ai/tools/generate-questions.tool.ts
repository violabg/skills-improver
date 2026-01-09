import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for generating assessment questions for specific skills.
 * Creates tailored interview-style questions based on skill category and context.
 */
export const generateQuestionsTool = tool({
  description:
    "Generate assessment questions for skills the user wants to validate. Creates 1 tailored question per skill, appropriate for the target role and industry.",

  inputSchema: z.object({
    skills: z
      .array(
        z.object({
          id: z.string().describe("Skill ID"),
          name: z.string().describe("Skill name"),
          category: z.enum(["HARD", "SOFT", "META"]).describe("Skill category"),
        })
      )
      .describe("Array of skills to generate questions for"),
    context: z
      .object({
        currentRole: z.string().describe("User's current role"),
        targetRole: z.string().describe("User's target role"),
        industry: z.string().optional().describe("Industry context"),
      })
      .describe("User context for tailoring questions"),
  }),

  execute: async ({ skills, context }) => {
    const skillsList = skills
      .map((s) => `- [${s.id}] ${s.name} (${s.category})`)
      .join("\n");

    return {
      skills,
      context,
      skillsList,
      questionTypes: {
        code: "For HARD skills like React, Python, etc. Ask for a code snippet or refactoring approach.",
        scenario:
          "For SOFT/META skills or Architecture. Describe a situation and ask how they'd handle it.",
        explain:
          "For conceptual understanding. Ask them to explain a complex concept or trade-off.",
      },
      guidelines: [
        "Make questions relevant to the target role",
        "Frame scenarios within the industry context when known",
        "Ensure skillId matches exactly the ID provided",
        "Include evaluationCriteria for each question",
      ],
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Question generation context prepared for ${output.skills.length} skills (${output.context.currentRole} → ${output.context.targetRole}).`,
  }),
});

export type GenerateQuestionsTool = typeof generateQuestionsTool;
