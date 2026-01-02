import { z } from "zod";

export const SkillEvaluationSchema = z.object({
  skillId: z.string().uuid(),
  level: z
    .number()
    .min(0, "Level must be at least 0")
    .max(5, "Level must be at most 5")
    .describe("Skill level from 0 (no knowledge) to 5 (expert)"),
  confidence: z
    .number()
    .min(0, "Confidence must be at least 0")
    .max(1, "Confidence must be at most 1")
    .describe("Confidence in the evaluation from 0 to 1"),
  notes: z
    .string()
    .describe("Detailed notes explaining the evaluation and reasoning"),
  strengths: z
    .array(z.string())
    .describe("List of identified strengths in the response"),
  weaknesses: z
    .array(z.string())
    .describe("List of identified weaknesses or gaps"),
});

export type SkillEvaluation = z.infer<typeof SkillEvaluationSchema>;
