import { z } from "zod";

export const QuestionSuggestionSchema = z.object({
  questions: z
    .array(
      z.object({
        skillId: z
          .string()
          .uuid()
          .describe("ID of the skill this question tests"),
        type: z
          .enum(["code", "scenario", "explain"])
          .describe("Type of question"),
        question: z.string().describe("The actual question text"),
        context: z
          .string()
          .optional()
          .describe("Additional context or scenario description if needed"),
        evaluationCriteria: z
          .string()
          .describe("Brief notes on what a good answer should include"),
      })
    )
    .describe("List of questions generated for the requested skills"),
});

export type QuestionSuggestion = z.infer<typeof QuestionSuggestionSchema>;
