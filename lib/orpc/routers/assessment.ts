import { assessSkill } from "@/lib/ai/assessSkill";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { z } from "zod";
import { AssessmentResult } from "../../prisma/client";
import { protectedProcedure } from "../procedures";

export const assessmentRouter = {
  // Start a new assessment
  start: protectedProcedure
    .input(
      z.object({
        currentRole: z.string().min(1, "Current role is required"),
        yearsExperience: z.string().optional(),
        industry: z.string().optional(),
        careerIntent: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.create({
        data: {
          userId: ctx.user.id,
          currentRole: input.currentRole,
          yearsExperience: input.yearsExperience,
          industry: input.industry,
          careerIntent: input.careerIntent,
          status: "IN_PROGRESS",
          lastStepCompleted: 1, // Profile setup is step 1
        },
      });

      return assessment;
    }),

  // Get user's most recent draft (incomplete) assessment
  getDraft: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;
    const draft = await ctx.db.assessment.findFirst({
      where: {
        userId: ctx.user.id,
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
      include: {
        results: {
          include: { skill: true },
        },
      },
    });
    return draft;
  }),

  // Save progress (update which step user completed)
  saveProgress: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        step: z.number().int().min(1).max(5),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

      const updated = await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: { lastStepCompleted: input.step },
      });

      return updated;
    }),

  // Submit an answer for evaluation
  submitAnswer: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        skillId: z.string().uuid(),
        answer: z.string().min(1, "Answer is required"),
        question: z.string().min(1, "Question is required"),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      // Verify assessment belongs to user
      const assessment = await ctx.db.assessment.findFirst({
        where: {
          id: input.assessmentId,
          userId: ctx.user.id,
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Verify skill exists
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.skillId },
      });

      if (!skill) {
        throw new Error("Skill not found");
      }

      // Call AI evaluation function
      const evaluation = await assessSkill({
        skillId: skill.id,
        skillName: skill.name,
        skillCategory: skill.category,
        question: input.question,
        answer: input.answer,
      });

      // Persist validated AI output. Use upsert semantics to avoid unique
      // constraint failures when a self-evaluation row already exists for
      // the (assessmentId, skillId) pair.
      const existing = await ctx.db.assessmentResult.findFirst({
        where: {
          assessmentId: input.assessmentId,
          skillId: input.skillId,
        },
      });

      if (existing) {
        const updated = await ctx.db.assessmentResult.update({
          where: { id: existing.id },
          data: {
            level: evaluation.level,
            confidence: evaluation.confidence,
            notes: evaluation.notes,
            rawAIOutput: {
              strengths: evaluation.strengths,
              weaknesses: evaluation.weaknesses,
            },
          },
        });

        return updated;
      }

      const created = await ctx.db.assessmentResult.create({
        data: {
          assessmentId: input.assessmentId,
          skillId: input.skillId,
          level: evaluation.level,
          confidence: evaluation.confidence,
          notes: evaluation.notes,
          rawAIOutput: {
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
          },
        },
      });

      return created;
    }),

  // Update assessment target role (persist career goal)
  updateGoal: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        targetRole: z.string().min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

      const updated = await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: {
          targetRole: input.targetRole,
          lastStepCompleted: 2, // Goal is step 2
        },
      });

      return updated;
    }),

  // Save self-evaluation ratings as AssessmentResult rows (upsert semantics)
  saveSelfEvaluations: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        evaluations: z.array(
          z.object({
            skillId: z.string().uuid(),
            level: z.number().int(),
            shouldTest: z.boolean().optional(),
          }),
        ),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

      const results: AssessmentResult[] = [];

      for (const ev of input.evaluations) {
        // Try update existing result
        const existing = await ctx.db.assessmentResult.findFirst({
          where: {
            assessmentId: input.assessmentId,
            skillId: ev.skillId,
          },
        });

        // Calculate confidence based on self-evaluation level
        // Lower self-ratings get lower confidence (user is uncertain)
        // Higher self-ratings get higher confidence (user is more certain)
        // Scale: 0.3 (low) to 0.7 (high) - never fully confident for self-eval
        const confidence =
          ev.level <= 1
            ? 0.3
            : ev.level <= 2
              ? 0.4
              : ev.level <= 3
                ? 0.5
                : ev.level <= 4
                  ? 0.6
                  : 0.7;

        if (existing) {
          const updated = await ctx.db.assessmentResult.update({
            where: { id: existing.id },
            data: {
              level: ev.level,
              confidence,
              shouldTest: ev.shouldTest ?? existing.shouldTest,
            },
          });
          results.push(updated);
          continue;
        }

        // Create new AssessmentResult row
        const created = await ctx.db.assessmentResult.create({
          data: {
            assessmentId: input.assessmentId,
            skillId: ev.skillId,
            level: ev.level,
            confidence,
            shouldTest: ev.shouldTest ?? false,
          },
        });

        results.push(created);
      }

      // Update assessment progress to step 3 (self-evaluation)
      await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: { lastStepCompleted: 3 },
      });

      return { ok: true, saved: results.length };
    }),

  // Get assessment results
  getResults: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.findFirst({
        where: {
          id: input.assessmentId,
          userId: ctx.user.id,
        },
        include: {
          results: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      return assessment;
    }),

  // List user's assessments
  list: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;
    const assessments = await ctx.db.assessment.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        results: {
          include: {
            skill: true,
          },
        },
      },
    });

    return assessments;
  }),

  // Finalize assessment and mark as completed
  finalize: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.findFirst({
        where: {
          id: input.assessmentId,
          userId: ctx.user.id,
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      const updated = await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          results: {
            include: {
              skill: true,
            },
          },
        },
      });

      return updated;
    }),
};
