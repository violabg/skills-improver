import { oc } from "@orpc/contract";
import { z } from "zod";

const skillSummarySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    category: z.enum(["HARD", "SOFT", "META"]),
  })
  .loose();

const assessmentResultSchema = z
  .object({
    id: z.uuid(),
    skillId: z.uuid(),
    level: z.number(),
    shouldTest: z.boolean(),
    skill: skillSummarySchema,
  })
  .loose();

const assessmentSchema = z
  .object({
    id: z.uuid(),
    currentRole: z.string().nullable().optional(),
    targetRole: z.string().nullable().optional(),
    results: z.array(assessmentResultSchema).optional(),
  })
  .loose();

export const assessmentContract = {
  start: oc
    .input(
      z.object({
        currentRole: z.string().min(1, "Current role is required"),
        yearsExperience: z.string().optional(),
        industry: z.string().optional(),
        careerIntent: z.string().optional(),
      }),
    )
    .output(assessmentSchema),

  getDraft: oc.output(assessmentSchema.nullable()),

  saveProgress: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        step: z.number().int().min(1).max(5),
      }),
    )
    .output(assessmentSchema),

  submitAnswer: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        skillId: z.uuid(),
        answer: z.string().min(1, "Answer is required"),
        question: z.string().min(1, "Question is required"),
      }),
    )
    .output(assessmentResultSchema),

  updateGoal: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        targetRole: z.string().min(1),
      }),
    )
    .output(assessmentSchema),

  saveSelfEvaluations: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        evaluations: z.array(
          z.object({
            skillId: z.uuid(),
            level: z.number().int(),
            shouldTest: z.boolean().optional(),
          }),
        ),
      }),
    )
    .output(z.object({ ok: z.boolean(), saved: z.number().int() })),

  getResults: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
      }),
    )
    .output(assessmentSchema),

  list: oc.output(z.array(assessmentSchema)),

  finalize: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
      }),
    )
    .output(assessmentSchema),
};
