import { assessSkill } from "@/lib/ai/assessSkill";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { AssessmentResult } from "../../prisma/client";
import { authed } from "../procedures";

export const assessmentRouter = {
  start: authed.assessment.start.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    const assessment = await ctx.db.assessment.create({
      data: {
        userId: ctx.user.id,
        currentRole: input.currentRole,
        yearsExperience: input.yearsExperience,
        industry: input.industry,
        careerIntent: input.careerIntent,
        status: "IN_PROGRESS",
        lastStepCompleted: 1,
      },
    });

    return assessment;
  }),

  getDraft: authed.assessment.getDraft.handler(async ({ context }) => {
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

  saveProgress: authed.assessment.saveProgress.handler(
    async ({ input, context }) => {
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
    },
  ),

  submitAnswer: authed.assessment.submitAnswer.handler(
    async ({ input, context }) => {
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

      const skill = await ctx.db.skill.findUnique({
        where: { id: input.skillId },
      });

      if (!skill) {
        throw new Error("Skill not found");
      }

      const evaluation = await assessSkill({
        skillId: skill.id,
        skillName: skill.name,
        skillCategory: skill.category,
        question: input.question,
        answer: input.answer,
      });

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
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
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
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      return created;
    },
  ),

  updateGoal: authed.assessment.updateGoal.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

      const updated = await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: {
          targetRole: input.targetRole,
          lastStepCompleted: 2,
        },
      });

      return updated;
    },
  ),

  saveSelfEvaluations: authed.assessment.saveSelfEvaluations.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

      const results: AssessmentResult[] = [];

      for (const ev of input.evaluations) {
        const existing = await ctx.db.assessmentResult.findFirst({
          where: {
            assessmentId: input.assessmentId,
            skillId: ev.skillId,
          },
        });

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

      await ctx.db.assessment.update({
        where: { id: input.assessmentId },
        data: { lastStepCompleted: 3 },
      });

      return { ok: true, saved: results.length };
    },
  ),

  getResults: authed.assessment.getResults.handler(
    async ({ input, context }) => {
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
    },
  ),

  list: authed.assessment.list.handler(async ({ context }) => {
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

  finalize: authed.assessment.finalize.handler(async ({ input, context }) => {
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
