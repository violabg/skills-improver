import { z } from "zod";

export const GapExplanationSchema = z.object({
  skillId: z.string().uuid(),
  skillName: z.string(),
  currentLevel: z
    .number()
    .min(0)
    .max(5)
    .describe("Current assessed skill level"),
  targetLevel: z.number().min(0).max(5).describe("Required level for goal"),
  gapSize: z
    .number()
    .min(0)
    .max(5)
    .describe("Difference between target and current level"),
  impact: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .describe("Impact of this gap on achieving the career goal"),
  explanation: z
    .string()
    .describe("Why this gap matters and how it blocks progress"),
  recommendedActions: z
    .array(z.string())
    .describe("Specific actions to close this gap"),
  estimatedTimeWeeks: z
    .number()
    .positive()
    .describe("Estimated weeks to close this gap"),
  priority: z.number().min(1).max(10).describe("Priority ranking (1-10)"),
});

export type GapExplanation = z.infer<typeof GapExplanationSchema>;

export const GapAnalysisSchema = z.object({
  assessmentId: z.string().uuid(),
  targetRole: z.string(),
  readinessScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall readiness percentage for target role"),
  gaps: z.array(GapExplanationSchema).describe("Ranked list of skill gaps"),
  strengths: z
    .array(z.string())
    .describe("Skills that are already at target level"),
  overallRecommendation: z
    .string()
    .describe("High-level guidance for career progression"),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
