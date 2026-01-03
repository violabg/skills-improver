import { assessSkill } from "@/lib/ai/assessSkill";
import { generateAdvisorResponse } from "@/lib/ai/chat-advisor";
import { gapAnalysisModel } from "@/lib/ai/models";
import { GapAnalysisSchema } from "@/lib/ai/schemas/gapExplanation.schema";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { processEvidence } from "@/lib/services/evidenceProcessor";
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

        // Fetch user's evidence items to match against skills (in-memory filter)
        const userEvidence = await ctx.db.evidence.findMany({
          where: { userId: ctx.user.id },
        });

        // Batch fetch ResourceSkill links for all gap skills and attach resources.
        // Use dynamic access to handle environments where the Prisma client
        // has not been regenerated after schema changes.
        const skillIds = gaps.map((g) => g.skillId);
        let resourceLinks: Array<{ skillId: string; resource: unknown }> = [];
        try {
          const dbAny = ctx.db as unknown as Record<string, unknown>;
          if (
            dbAny.resourceSkill &&
            typeof (dbAny.resourceSkill as Record<string, unknown>).findMany ===
              "function"
          ) {
            resourceLinks = await (
              dbAny.resourceSkill as {
                findMany: (
                  args: unknown
                ) => Promise<Array<{ skillId: string; resource: unknown }>>;
              }
            ).findMany({
              where: { skillId: { in: skillIds } },
              include: { resource: true },
            });
          } else {
            throw new Error("resourceSkill model not present on client");
          }
        } catch {
          // Fallback: substring-match resources per skill (less efficient)
          resourceLinks = [];
          for (const s of allSkills) {
            const matchedResources = await ctx.db.resource.findMany({
              where: {
                OR: [
                  { title: { contains: s.name, mode: "insensitive" } },
                  { url: { contains: s.name, mode: "insensitive" } },
                ],
              },
              orderBy: { createdAt: "desc" },
            });
            for (const r of matchedResources) {
              resourceLinks.push({ skillId: s.id, resource: r });
            }
          }
        }

        const resourcesBySkill = new Map<string, Array<unknown>>();
        for (const link of resourceLinks) {
          const arr = resourcesBySkill.get(link.skillId) || [];
          arr.push(link.resource);
          resourcesBySkill.set(link.skillId, arr);
        }

        for (const g of gaps) {
          const matchedResources = (
            resourcesBySkill.get(g.skillId) || []
          ).slice(0, 3);

          const relatedEvidence = userEvidence.filter((ev) => {
            const signals = ev.signals as
              | Record<string, unknown>
              | null
              | undefined;
            const matched = signals?.matchedSkills;
            if (!matched || !Array.isArray(matched)) return false;
            return matched.some((m: { id: string }) => m.id === g.skillId);
          });

          (g as Record<string, unknown>).resources = matchedResources;
          (g as Record<string, unknown>).evidence = relatedEvidence.map(
            (e) => ({
              id: e.id,
              provider: e.provider,
              referenceUrl: e.referenceUrl,
              signals: e.signals,
              createdAt: e.createdAt,
            })
          );
        }

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

  resources: {
    // List resources (public, optional provider filter)
    list: publicProcedure
      .input(
        z
          .object({
            provider: z.string().optional(),
          })
          .optional()
      )
      .handler(async ({ input, context }) => {
        const ctx = context as BaseContext;
        const resources = await ctx.db.resource.findMany({
          where: {
            ...(input?.provider && { provider: input.provider }),
          },
          orderBy: { createdAt: "desc" },
        });

        return resources;
      }),

    // Get single resource by id (public)
    get: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as BaseContext;
        const resource = await ctx.db.resource.findUnique({
          where: { id: input.id },
        });

        if (!resource) throw new Error("Resource not found");
        return resource;
      }),

    // Create resource (protected)
    create: protectedProcedure
      .input(
        z.object({
          provider: z.string().min(1),
          url: z.string().url(),
          title: z.string().optional(),
          cost: z.string().optional(),
          estimatedTime: z.number().int().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const resource = await ctx.db.resource.create({ data: input });
        return resource;
      }),

    // Update resource (protected)
    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          provider: z.string().optional(),
          url: z.string().url().optional(),
          title: z.string().optional(),
          cost: z.string().optional(),
          estimatedTime: z.number().int().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const { id, ...rest } = input;
        const resource = await ctx.db.resource.update({
          where: { id },
          data: rest as Partial<typeof input>,
        });
        return resource;
      }),

    // Delete resource (protected)
    delete: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        await ctx.db.resource.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  },

  evidence: {
    // Upload / register an evidence item (protected)
    create: protectedProcedure
      .input(
        z.object({
          provider: z.string().optional(),
          referenceUrl: z.string().url().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // Run lightweight evidence processing
        const { signals, rawStored } = await processEvidence({
          provider: input.provider,
          referenceUrl: input.referenceUrl,
        });

        const ev = await ctx.db.evidence.create({
          data: {
            userId: ctx.user.id,
            provider: input.provider,
            referenceUrl: input.referenceUrl,
            signals: signals as never,
            rawStored,
          },
        });

        return ev;
      }),

    // List user evidence items
    list: protectedProcedure.handler(async ({ context }) => {
      const ctx = context as AuthenticatedContext;
      const items = await ctx.db.evidence.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
      });
      return items;
    }),

    // Get one evidence item
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const ev = await ctx.db.evidence.findFirst({
          where: { id: input.id, userId: ctx.user.id },
        });
        if (!ev) throw new Error("Evidence not found");
        return ev;
      }),

    // Delete evidence
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        await ctx.db.evidence.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  },

  chat: {
    // Send a message to the AI advisor
    sendMessage: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message cannot be empty"),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // Fetch user's most recent assessment for context
        const latestAssessment = await ctx.db.assessment.findFirst({
          where: {
            userId: ctx.user.id,
            status: "COMPLETED",
          },
          orderBy: {
            completedAt: "desc",
          },
          include: {
            results: {
              include: {
                skill: true,
              },
            },
          },
        });

        // Build context
        const userContext: {
          userId: string;
          assessmentSummary?: string;
          recentGaps?: Array<{
            skillName: string;
            gapSize: number;
            impact: string;
          }>;
          targetRole?: string;
        } = {
          userId: ctx.user.id,
        };

        if (latestAssessment) {
          userContext.targetRole = latestAssessment.targetRole || undefined;

          // Build assessment summary
          const resultSummary = latestAssessment.results
            .slice(0, 5)
            .map(
              (r) =>
                `${r.skill.name}: Level ${r.level}/5 (${Math.round(
                  r.confidence * 100
                )}% confidence)`
            )
            .join("\n");

          userContext.assessmentSummary = resultSummary;

          // Calculate top gaps
          const gaps = latestAssessment.results
            .map((r) => ({
              skillName: r.skill.name,
              currentLevel: r.level,
              targetLevel: r.skill.difficulty || 3,
              gapSize: Math.max(0, (r.skill.difficulty || 3) - r.level),
            }))
            .filter((g) => g.gapSize > 0)
            .sort((a, b) => b.gapSize - a.gapSize)
            .slice(0, 3);

          userContext.recentGaps = gaps.map((g) => ({
            skillName: g.skillName,
            gapSize: g.gapSize,
            impact:
              g.gapSize > 2 ? "CRITICAL" : g.gapSize > 1 ? "HIGH" : "MEDIUM",
          }));
        }

        // Generate AI response
        const response = await generateAdvisorResponse(
          input.message,
          userContext
        );

        return response;
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
