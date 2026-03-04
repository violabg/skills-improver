import { oc } from "@orpc/contract";
import { z } from "zod";

const gapResultSchema = z.object({
  skillId: z.uuid(),
  skillName: z.string(),
  currentLevel: z.number().min(0).max(5),
  targetLevel: z.number().min(0).max(5),
  gapSize: z.number().min(0).max(5),
  impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  explanation: z.string(),
  recommendedActions: z.array(z.string()),
  estimatedTimeWeeks: z.number().positive(),
  priority: z.number(),
});

export const gapsContract = {
  checkStatus: oc
    .input(z.object({ assessmentId: z.uuid() }))
    .output(z.record(z.string(), z.unknown())),

  analyzeSkill: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        skillId: z.uuid(),
        skillName: z.string(),
        currentLevel: z.number().min(0).max(5),
        category: z.enum(["HARD", "SOFT", "META"]),
        targetRole: z.string(),
        otherSkillsSummary: z.string().optional(),
      }),
    )
    .output(gapResultSchema),

  save: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        gaps: z.array(
          z.object({
            skillId: z.uuid(),
            skillName: z.string(),
            currentLevel: z.number().min(0).max(5),
            targetLevel: z.number().min(0).max(5),
            gapSize: z.number().min(0).max(5),
            impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            explanation: z.string(),
            recommendedActions: z.array(z.string()),
            estimatedTimeWeeks: z.number().positive(),
            priority: z.number().min(1).max(10),
          }),
        ),
        strengths: z.array(z.string()),
        readinessScore: z.number().min(0).max(100),
        overallRecommendation: z.string(),
      }),
    )
    .output(z.object({ success: z.boolean(), gapsId: z.uuid() })),

  get: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
      }),
    )
    .output(z.record(z.string(), z.unknown())),
};
