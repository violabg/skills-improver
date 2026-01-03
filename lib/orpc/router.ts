import { assessSkill } from "@/lib/ai/assessSkill";
import { gapAnalysisModel } from "@/lib/ai/models";
import { GapAnalysisSchema } from "@/lib/ai/schemas/gapExplanation.schema";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { generateText, Output } from "ai";
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

    // Finalize assessment and mark as completed
    finalize: protectedProcedure
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

    // Get skill gaps analysis for assessment
    getGaps: protectedProcedure
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

        if (!assessment.targetRole) {
          throw new Error("Assessment has no target role");
        }

        // Get all skills and their target levels (simplified for MVP)
        const allSkills = await ctx.db.skill.findMany({
          where: { assessable: true },
        });

        // Build assessment results map
        const resultsMap = new Map(
          assessment.results.map((r) => [r.skillId, r])
        );

        // Calculate gaps
        const gaps = allSkills.map((skill) => {
          const result = resultsMap.get(skill.id);
          const currentLevel = result?.level ?? 0;
          // For MVP, target level is based on skill difficulty and career goal
          const targetLevel = skill.difficulty ?? 3;
          const gapSize = Math.max(0, targetLevel - currentLevel);

          return {
            skillId: skill.id,
            skillName: skill.name,
            currentLevel,
            targetLevel,
            gapSize,
            impact: gapSize > 2 ? "CRITICAL" : gapSize > 1 ? "HIGH" : "MEDIUM",
            explanation: `${skill.name} is ${
              gapSize > 0 ? "required for" : "not critical for"
            } ${assessment.targetRole}`,
            recommendedActions: [
              `Focus on improving ${skill.name}`,
              `Seek mentorship or structured learning`,
            ],
            estimatedTimeWeeks: gapSize * 2,
            priority: 10 - gapSize * 2, // Higher gaps = higher priority
          };
        });

        // Sort by priority
        gaps.sort((a, b) => b.priority - a.priority);

        // Calculate readiness score
        const readinessScore = Math.round(
          ((allSkills.length - gaps.filter((g) => g.gapSize > 0).length) /
            allSkills.length) *
            100
        );

        return {
          assessmentId: input.assessmentId,
          targetRole: assessment.targetRole,
          readinessScore,
          gaps,
          strengths: gaps
            .filter((g) => g.gapSize === 0)
            .map((g) => g.skillName),
          overallRecommendation: `You are ${readinessScore}% ready for ${assessment.targetRole}. Focus on the top priorities to accelerate your transition.`,
        };
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

  report: {
    // Generate a skill gap report for an assessment
    generate: protectedProcedure
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

        if (!assessment.targetRole) {
          throw new Error("Assessment has no target role");
        }

        // Get all skills
        const allSkills = await ctx.db.skill.findMany();

        // Build assessment summary for AI
        const assessmentSummary = assessment.results
          .map(
            (r) =>
              `${r.skill.name}: Level ${r.level} (Confidence: ${r.confidence})`
          )
          .join("\n");

        // Call AI to analyze gaps
        const aiAnalysis = await generateText({
          model: gapAnalysisModel,
          output: Output.object({ schema: GapAnalysisSchema }),
          prompt: buildGapAnalysisPrompt(
            assessment.targetRole,
            assessmentSummary,
            allSkills
          ),
        });

        return {
          assessmentId: input.assessmentId,
          targetRole: assessment.targetRole,
          generatedAt: new Date().toISOString(),
          analysis: aiAnalysis.output,
        };
      }),
  },
};

export type Router = typeof router;

// Helper function to build gap analysis prompt
function buildGapAnalysisPrompt(
  targetRole: string,
  assessmentSummary: string,
  allSkills: Array<{ id: string; name: string; category: string }>
): string {
  const skillList = allSkills
    .map((s) => `- ${s.name} (${s.category} skill)`)
    .join("\n");

  return `You are a senior career advisor analyzing a professional's readiness for a new role.

**Target Role:** ${targetRole}

**Skills Assessed:**
${assessmentSummary}

**Available Skills in the System:**
${skillList}

**Your Task:**
1. Analyze which skills are critical for success in the target role
2. Identify the top 5 skill gaps that would most impact progression
3. For each gap, explain why it matters and how to close it
4. Calculate overall readiness as a percentage
5. Provide strategic guidance for career transition

Focus on:
- Hard skills essential for technical competence
- Soft skills critical for leadership/seniority
- Meta-skills for continuous learning and growth

Be realistic and constructive. Rank gaps by impact, not just by size.`;
}
