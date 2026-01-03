import { assessSkill } from "@/lib/ai/assessSkill";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "./procedures";

export const router = {
  health: {
    ping: publicProcedure.handler(async () => {
      return { ok: true, timestamp: new Date().toISOString() };
    }),
  },

  assessment: {
    // Start a new assessment
    start: protectedProcedure
      .input(
        z.object({
          targetRole: z.string().min(1, "Target role is required"),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const assessment = await ctx.db.assessment.create({
          data: {
            userId: ctx.user.id,
            targetRole: input.targetRole,
            status: "IN_PROGRESS",
          },
        });

        return assessment;
      }),

    // Submit an answer for evaluation
    submitAnswer: protectedProcedure
      .input(
        z.object({
          assessmentId: z.string().uuid(),
          skillId: z.string().uuid(),
          answer: z.string().min(1, "Answer is required"),
          question: z.string().min(1, "Question is required"),
        })
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

        // Persist validated AI output
        const result = await ctx.db.assessmentResult.create({
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

        return result;
      }),

    // Get assessment results
    getResults: protectedProcedure
      .input(
        z.object({
          assessmentId: z.string().uuid(),
        })
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
  },

  skills: {
    // Get all skills (public)
    list: protectedProcedure
      .input(
        z
          .object({
            category: z.enum(["HARD", "SOFT", "META"]).optional(),
            domain: z.string().optional(),
          })
          .optional()
      )
      .handler(async ({ input, context }) => {
        const ctx = context as BaseContext;
        const skills = await ctx.db.skill.findMany({
          where: {
            ...(input?.category && { category: input.category }),
            ...(input?.domain && { domain: input.domain }),
          },
          orderBy: {
            name: "asc",
          },
        });

        return skills;
      }),

    // Get skill by ID (public)
    get: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as BaseContext;
        const skill = await ctx.db.skill.findUnique({
          where: { id: input.id },
          include: {
            fromRelations: {
              include: {
                toSkill: true,
              },
            },
            toRelations: {
              include: {
                fromSkill: true,
              },
            },
          },
        });

        if (!skill) {
          throw new Error("Skill not found");
        }

        return skill;
      }),

    // Get skill graph (public)
    getGraph: publicProcedure.handler(async ({ context }) => {
      const ctx = context as BaseContext;
      const skills = await ctx.db.skill.findMany({
        include: {
          fromRelations: {
            include: {
              toSkill: true,
            },
          },
        },
      });

      return skills;
    }),
  },

  user: {
    // Get current user profile
    me: protectedProcedure.handler(async ({ context }) => {
      const ctx = context as AuthenticatedContext;
      return ctx.user;
    }),

    // Update user profile
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const user = await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: input,
        });

        return user;
      }),
  },
};

export type Router = typeof router;
