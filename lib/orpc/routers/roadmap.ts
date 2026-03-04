import {
  generateRoadmap,
  generateVerificationQuestion,
  verifySkillProgress,
} from "@/lib/ai";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { MilestoneStatus, VerificationMethod } from "../../prisma/client";
import { authed } from "../procedures";

export const roadmapRouter = {
  generate: authed.roadmap.generate.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const assessment = await ctx.db.assessment.findFirst({
      where: { id: input.assessmentId, userId: ctx.user.id },
      include: { gaps: true },
    });

    if (!assessment) throw new Error("Assessment not found");
    if (!assessment.gaps) throw new Error("Assessment has no gap analysis");
    if (!assessment.targetRole)
      throw new Error("Assessment has no target role");

    const existingRoadmap = await ctx.db.roadmap.findUnique({
      where: { assessmentId: input.assessmentId },
      include: { milestones: true },
    });
    if (existingRoadmap) {
      return existingRoadmap;
    }

    const gapsJson = assessment.gaps.gaps as Array<{
      skillId: string;
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      gapSize: number;
      impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      priority: number;
    }>;

    const actualGaps = gapsJson.filter((g) => g.gapSize > 0);

    if (actualGaps.length === 0) {
      throw new Error("No skill gaps found - you're already ready!");
    }

    const suggestion = await generateRoadmap({
      targetRole: assessment.targetRole,
      currentRole: assessment.currentRole ?? undefined,
      gaps: actualGaps,
      yearsExperience: assessment.yearsExperience ?? undefined,
      careerIntent: assessment.careerIntent ?? undefined,
      industry: assessment.industry ?? undefined,
    });

    const roadmap = await ctx.db.roadmap.create({
      data: {
        assessmentId: input.assessmentId,
        userId: ctx.user.id,
        title: suggestion.title,
        totalWeeks: suggestion.totalWeeks,
        milestones: {
          create: suggestion.milestones.map((m) => ({
            skillId: m.skillId,
            weekNumber: m.weekNumber,
            title: m.title,
            description: m.description,
            resources: m.resources,
            status: "PENDING" as MilestoneStatus,
          })),
        },
      },
      include: { milestones: true },
    });

    return roadmap;
  }),

  getActive: authed.roadmap.getActive.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    const roadmap = await ctx.db.roadmap.findFirst({
      where: {
        userId: ctx.user.id,
        completedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        milestones: {
          include: { progress: true },
          orderBy: { weekNumber: "asc" },
        },
        assessment: {
          select: { targetRole: true, currentRole: true },
        },
      },
    });

    return roadmap;
  }),

  get: authed.roadmap.get.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const roadmap = await ctx.db.roadmap.findFirst({
      where: { id: input.roadmapId, userId: ctx.user.id },
      include: {
        milestones: {
          include: { progress: true },
          orderBy: { weekNumber: "asc" },
        },
        assessment: {
          select: { targetRole: true, currentRole: true },
        },
      },
    });

    if (!roadmap) throw new Error("Roadmap not found");
    return roadmap;
  }),

  completeMilestone: authed.roadmap.completeMilestone.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const milestone = await ctx.db.roadmapMilestone.findFirst({
        where: { id: input.milestoneId },
        include: { roadmap: true },
      });

      if (!milestone || milestone.roadmap.userId !== ctx.user.id) {
        throw new Error("Milestone not found");
      }

      const result = await ctx.db.$transaction(async (tx) => {
        const progress = await tx.milestoneProgress.create({
          data: {
            milestoneId: input.milestoneId,
            verificationMethod: input.method as VerificationMethod,
            selfReportedAt:
              input.method === "SELF_REPORTED" ? new Date() : null,
          },
        });

        await tx.roadmapMilestone.update({
          where: { id: input.milestoneId },
          data: { status: "COMPLETED" as MilestoneStatus },
        });

        await tx.userSkillHistory.create({
          data: {
            userId: ctx.user.id,
            skillId: milestone.skillId,
            level: 4,
            confidence: input.method === "SELF_REPORTED" ? 0.6 : 0.8,
            source: input.method as VerificationMethod,
            assessmentId: milestone.roadmap.assessmentId,
          },
        });

        const allMilestones = await tx.roadmapMilestone.findMany({
          where: { roadmapId: milestone.roadmapId },
        });
        const allCompleted = allMilestones.every(
          (m) => m.status === "COMPLETED",
        );

        if (allCompleted) {
          await tx.roadmap.update({
            where: { id: milestone.roadmapId },
            data: { completedAt: new Date() },
          });
        }

        return progress;
      });

      return { success: true, progressId: result.id };
    },
  ),

  startVerification: authed.roadmap.startVerification.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const milestone = await ctx.db.roadmapMilestone.findFirst({
        where: { id: input.milestoneId },
        include: { roadmap: true },
      });

      if (!milestone || milestone.roadmap.userId !== ctx.user.id) {
        throw new Error("Milestone not found");
      }

      const skill = await ctx.db.skill.findUnique({
        where: { id: milestone.skillId },
      });

      if (!skill) throw new Error("Skill not found");

      const question = await generateVerificationQuestion({
        skillId: skill.id,
        skillName: skill.name,
        skillCategory: skill.category,
        currentLevel: 3,
        targetLevel: 4,
        milestoneTitle: milestone.title,
        milestoneDescription: milestone.description ?? undefined,
      });

      return {
        milestoneId: input.milestoneId,
        skillName: skill.name,
        question: question.question,
        expectedTopics: question.expectedTopics,
        difficulty: question.difficulty,
      };
    },
  ),

  submitVerificationAnswer: authed.roadmap.submitVerificationAnswer.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const milestone = await ctx.db.roadmapMilestone.findFirst({
        where: { id: input.milestoneId },
        include: { roadmap: true },
      });

      if (!milestone || milestone.roadmap.userId !== ctx.user.id) {
        throw new Error("Milestone not found");
      }

      const skill = await ctx.db.skill.findUnique({
        where: { id: milestone.skillId },
      });

      if (!skill) throw new Error("Skill not found");

      const result = await verifySkillProgress({
        skillId: skill.id,
        skillName: skill.name,
        skillCategory: skill.category,
        currentLevel: 3,
        targetLevel: 4,
        milestoneTitle: milestone.title,
        milestoneDescription: milestone.description ?? undefined,
        question: input.question,
        userAnswer: input.answer,
      });

      if (result.passed) {
        await ctx.db.$transaction(async (tx) => {
          await tx.milestoneProgress.create({
            data: {
              milestoneId: input.milestoneId,
              verificationMethod: "AI_VERIFIED" as VerificationMethod,
              aiVerifiedAt: new Date(),
              aiVerificationScore: result.score,
              aiVerificationNotes: result.feedback,
            },
          });

          await tx.roadmapMilestone.update({
            where: { id: input.milestoneId },
            data: { status: "COMPLETED" as MilestoneStatus },
          });

          await tx.userSkillHistory.create({
            data: {
              userId: ctx.user.id,
              skillId: milestone.skillId,
              level: result.newLevel,
              confidence: result.score,
              source: "AI_VERIFIED" as VerificationMethod,
              assessmentId: milestone.roadmap.assessmentId,
            },
          });

          const allMilestones = await tx.roadmapMilestone.findMany({
            where: { roadmapId: milestone.roadmapId },
          });
          const allCompleted = allMilestones.every(
            (m) => m.status === "COMPLETED" || m.id === input.milestoneId,
          );

          if (allCompleted) {
            await tx.roadmap.update({
              where: { id: milestone.roadmapId },
              data: { completedAt: new Date() },
            });
          }
        });
      }

      return {
        passed: result.passed,
        score: result.score,
        newLevel: result.newLevel,
        feedback: result.feedback,
        followUpQuestion: result.followUpQuestion,
      };
    },
  ),

  list: authed.roadmap.list.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    const roadmaps = await ctx.db.roadmap.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        milestones: { select: { id: true, status: true } },
        assessment: { select: { targetRole: true } },
      },
    });

    return roadmaps.map((r) => ({
      id: r.id,
      title: r.title,
      totalWeeks: r.totalWeeks,
      targetRole: r.assessment.targetRole,
      completedAt: r.completedAt,
      progress: {
        total: r.milestones.length,
        completed: r.milestones.filter((m) => m.status === "COMPLETED").length,
      },
    }));
  }),
};
