import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for evaluating a candidate's skill level based on their Q&A response.
 * Returns structured evaluation with level, confidence, notes, strengths, and weaknesses.
 */
export const evaluateSkillTool = tool({
  description:
    "Evaluate a candidate's skill level based on their answer to an assessment question. Returns level (0-5), confidence score, detailed notes, strengths, and areas for improvement.",

  inputSchema: z.object({
    skillId: z.string().describe("Unique ID of the skill being evaluated"),
    skillName: z.string().describe("Name of the skill (e.g., 'React Hooks')"),
    skillCategory: z
      .enum(["HARD", "SOFT", "META"])
      .describe(
        "Category: HARD (technical), SOFT (interpersonal), META (learning/growth)"
      ),
    question: z.string().describe("The assessment question asked"),
    answer: z.string().describe("The candidate's response to the question"),
    context: z
      .string()
      .optional()
      .describe("Additional context like target role or industry"),
  }),

  execute: async ({
    skillId,
    skillName,
    skillCategory,
    question,
    answer,
    context,
  }) => {
    const categoryGuidance: Record<string, string> = {
      HARD: "Focus on technical accuracy, depth of understanding, and practical application. Consider code quality, best practices, and problem-solving approach.",
      SOFT: "Evaluate communication clarity, emotional intelligence, interpersonal skills, and situational judgment. Consider maturity, empathy, and practical wisdom.",
      META: "Assess strategic thinking, self-awareness, learning ability, and adaptability. Consider growth mindset and meta-cognitive skills.",
    };

    // This tool sets up the evaluation context for the agent
    // The agent will use its reasoning to generate the actual evaluation
    return {
      skillId,
      skillName,
      skillCategory,
      evaluationCriteria: categoryGuidance[skillCategory],
      question,
      answer,
      context,
      levelScale: {
        0: "No knowledge or understanding",
        1: "Awareness level - knows it exists, basic concepts",
        2: "Beginner - can use with guidance, limited experience",
        3: "Intermediate - practical working knowledge, some autonomy",
        4: "Advanced - deep understanding, can teach others, solves complex problems",
        5: "Expert - mastery level, innovates, recognized authority",
      },
    };
  },

  // Reduce tokens sent back to the model for subsequent steps
  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Prepared evaluation context for skill "${output.skillName}" (${output.skillCategory}).`,
  }),
});

export type EvaluateSkillTool = typeof evaluateSkillTool;
