import { oc } from "@orpc/contract";
import { z } from "zod";

const roadmapSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    totalWeeks: z.number().int().positive(),
  })
  .loose();

export const roadmapContract = {
  generate: oc
    .input(z.object({ assessmentId: z.uuid() }))
    .output(roadmapSchema),

  getActive: oc.output(roadmapSchema.nullable()),

  get: oc.input(z.object({ roadmapId: z.uuid() })).output(roadmapSchema),

  completeMilestone: oc
    .input(
      z.object({
        milestoneId: z.uuid(),
        method: z.enum(["SELF_REPORTED", "AI_VERIFIED"]),
      }),
    )
    .output(z.object({ success: z.boolean(), progressId: z.uuid() })),

  startVerification: oc.input(z.object({ milestoneId: z.uuid() })).output(
    z.object({
      milestoneId: z.uuid(),
      skillName: z.string(),
      question: z.string(),
      expectedTopics: z.array(z.string()),
      difficulty: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]),
    }),
  ),

  submitVerificationAnswer: oc
    .input(
      z.object({
        milestoneId: z.uuid(),
        question: z.string(),
        answer: z.string().min(1, "Answer is required"),
      }),
    )
    .output(
      z.object({
        passed: z.boolean(),
        score: z.number().min(0).max(1),
        newLevel: z.number().int().min(1).max(5),
        feedback: z.string(),
        followUpQuestion: z.string(),
      }),
    ),

  list: oc.output(z.array(roadmapSchema)),
};
