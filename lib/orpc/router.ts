import { assessSkill } from "@/lib/ai/assessSkill";
import { generateAdvisorResponse } from "@/lib/ai/chat-advisor";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { processEvidence } from "@/lib/services/evidenceProcessor";
import { z } from "zod";
import { analyzeSkillGap, generateQuestions, generateSkills } from "../ai";
import { AssessmentResult, Resource } from "../prisma/client";
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
          currentRole: z.string().min(1, "Current role is required"),
          yearsExperience: z.string().optional(),
          industry: z.string().optional(),
          careerIntent: z.string().optional(),
        })
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
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const assessment = await ctx.db.assessment.findFirst({
          where: { id: input.assessmentId, userId: ctx.user.id },
        });

        if (!assessment) throw new Error("Assessment not found");

        const updated = await ctx.db.assessment.update({
          where: { id: input.assessmentId },
          data: { targetRole: input.targetRole },
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
            })
          ),
        })
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

        return { ok: true, saved: results.length };
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

    // Generate skills based on profile (protected)
    generateForProfile: protectedProcedure
      .input(
        z.object({
          assessmentId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // 1. Fetch assessment to get profile data
        const assessment = await ctx.db.assessment.findUnique({
          where: { id: input.assessmentId, userId: ctx.user.id },
        });

        if (!assessment) throw new Error("Assessment not found");
        if (!assessment.targetRole)
          throw new Error("Assessment target role not set");

        // 2. Fetch all existing skills to provide context to AI
        // We limit to key fields to reduce token usage
        const allSkills = await ctx.db.skill.findMany({
          select: { id: true, name: true, category: true, domain: true },
        });

        const suggestion = await generateSkills({
          currentRole: assessment.currentRole || "Unknown",
          targetRole: assessment.targetRole,
          industry: assessment.industry,
          yearsExperience: assessment.yearsExperience,
          careerIntent: assessment.careerIntent,
          existingSkills: allSkills,
        });

        // 4. Create any new skills AI suggested
        // We use a map to track all final skill IDs (both existing and newly created)
        const finalSkillIds = new Set<string>(suggestion.selectedSkillIds);

        for (const newSkill of suggestion.newSkills) {
          // Check if skill already exists by name (case insensitive) to avoid dupes
          const existing = await ctx.db.skill.findFirst({
            where: { name: { equals: newSkill.name, mode: "insensitive" } },
          });

          if (existing) {
            finalSkillIds.add(existing.id);
            continue;
          }

          // Create new skill
          const created = await ctx.db.skill.create({
            data: {
              name: newSkill.name,
              category: newSkill.category,
              domain: newSkill.domain,
              assessable: true,
              marketRelevance: 0.8, // Default
              difficulty: 3, // Default
            },
          });
          finalSkillIds.add(created.id);
        }

        // 5. Return full skill objects for the UI
        const skills = await ctx.db.skill.findMany({
          where: { id: { in: Array.from(finalSkillIds) } },
          orderBy: { category: "asc" }, // Group by category for UI
        });

        return {
          skills,
          reasoning: suggestion.reasoning,
        };
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

        // Get all skills and their target levels
        const allSkills = await ctx.db.skill.findMany({
          where: { assessable: true },
        });

        // Build assessment results map
        const resultsMap = new Map(
          assessment.results.map((r) => [r.skillId, r])
        );

        // Calculate gaps using profile data for personalization
        // Only include skills that were actually evaluated by the user
        const evaluatedSkills = allSkills.filter((skill) =>
          resultsMap.has(skill.id)
        );

        const gaps = evaluatedSkills.map((skill) => {
          const result = resultsMap.get(skill.id)!;
          const currentLevel = result.level;

          // Extract profile data for personalization
          const yearsExp = assessment.yearsExperience;
          const careerIntent = assessment.careerIntent;
          const industry = assessment.industry;

          // Experience adjustment: junior gets lower targets, senior gets higher
          const experienceAdjustment =
            yearsExp === "0-2" ? -1 : yearsExp === "10+" ? 1 : 0;

          // Career intent weights skill categories differently
          const isLeadershipIntent = careerIntent === "LEADERSHIP";
          const isSwitchIntent = careerIntent === "SWITCH";

          // Leadership role check (from targetRole OR careerIntent)
          const leadershipRole =
            isLeadershipIntent ||
            assessment.targetRole?.toLowerCase().includes("lead") ||
            assessment.targetRole?.toLowerCase().includes("manager");

          // Category weight based on career intent
          let categoryWeight = 1;
          if (skill.category === "SOFT" || skill.category === "META") {
            // Boost soft/meta skills for leadership path
            categoryWeight = isLeadershipIntent
              ? 1.4
              : leadershipRole
              ? 1.2
              : 1;
          } else if (skill.category === "HARD") {
            // Boost hard skills for role switchers (need to learn new tech)
            categoryWeight = isSwitchIntent ? 1.3 : 1;
          }

          // Target level derives from difficulty + experience + leadership adjustments
          const baseTarget = skill.difficulty ?? 3;
          const targetLevel = Math.min(
            5,
            Math.max(
              1,
              Math.round(
                baseTarget +
                  experienceAdjustment +
                  (leadershipRole &&
                  (skill.category === "SOFT" || skill.category === "META")
                    ? 1
                    : 0)
              )
            )
          );
          const gapSize = Math.max(0, targetLevel - currentLevel);

          const gapRatio = targetLevel === 0 ? 0 : gapSize / targetLevel;
          const impact =
            gapRatio >= 0.6
              ? "CRITICAL"
              : gapRatio >= 0.35
              ? "HIGH"
              : gapRatio > 0
              ? "MEDIUM"
              : "NONE";

          // Build contextual explanation using industry and intent
          const intentContext =
            careerIntent === "LEADERSHIP"
              ? "leadership transition"
              : careerIntent === "SWITCH"
              ? "role transition"
              : "career growth";
          const industryContext = industry ? ` in ${industry}` : "";

          return {
            skillId: skill.id,
            skillName: skill.name,
            currentLevel,
            targetLevel,
            gapSize,
            impact,
            explanation: `${skill.name} is ${
              gapSize > 0 ? "essential for" : "at target for"
            } ${assessment.targetRole}${industryContext} (transitioning from ${
              assessment.currentRole
            })`,
            recommendedActions: [
              `Focus on improving ${skill.name}`,
              categoryWeight > 1.2
                ? `High priority for your ${intentContext} path`
                : categoryWeight > 1
                ? `Practice with role-play or stakeholder scenarios`
                : `Complete a practical exercise or code review`,
            ],
            estimatedTimeWeeks: Math.max(
              1,
              Math.ceil(gapSize * categoryWeight)
            ),
            priority: Math.round(gapSize * categoryWeight * 10),
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

        const resourcesBySkill = new Map<string, Array<Resource>>();
        for (const link of resourceLinks) {
          const arr = resourcesBySkill.get(link.skillId) || [];
          // simple de-duplication by url/title where available
          const resource = link.resource as Resource;
          const exists = arr.some((r) => {
            if (resource.url && r.url === resource.url) return true;
            if (resource.title && r.title === resource.title) return true;
            return false;
          });
          if (!exists) {
            arr.push(resource);
            resourcesBySkill.set(link.skillId, arr);
          }
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

        // Sort by priority (highest gap/impact first)
        gaps.sort((a, b) => b.priority - a.priority);

        // Calculate readiness score weighted by target levels (using same profile-aware logic)
        const yearsExp = assessment.yearsExperience;
        const careerIntent = assessment.careerIntent;
        const experienceAdjustment =
          yearsExp === "0-2" ? -1 : yearsExp === "10+" ? 1 : 0;
        const isLeadershipIntent = careerIntent === "LEADERSHIP";
        const isSwitchIntent = careerIntent === "SWITCH";
        const leadershipRole =
          isLeadershipIntent ||
          assessment.targetRole?.toLowerCase().includes("lead") ||
          assessment.targetRole?.toLowerCase().includes("manager");

        const totals = evaluatedSkills.reduce(
          (acc, skill) => {
            const res = resultsMap.get(skill.id)!;
            const baseTarget = skill.difficulty ?? 3;

            let categoryWeight = 1;
            if (skill.category === "SOFT" || skill.category === "META") {
              categoryWeight = isLeadershipIntent
                ? 1.4
                : leadershipRole
                ? 1.2
                : 1;
            } else if (skill.category === "HARD") {
              categoryWeight = isSwitchIntent ? 1.3 : 1;
            }

            const targetLevel = Math.min(
              5,
              Math.max(
                1,
                Math.round(
                  baseTarget +
                    experienceAdjustment +
                    (leadershipRole &&
                    (skill.category === "SOFT" || skill.category === "META")
                      ? 1
                      : 0)
                )
              )
            );
            const weightedTarget = targetLevel * categoryWeight;
            const weightedCurrent =
              Math.min(targetLevel, res.level) * categoryWeight;
            acc.target += weightedTarget;
            acc.current += weightedCurrent;
            return acc;
          },
          { target: 0, current: 0 }
        );
        const readinessScore =
          totals.target === 0
            ? 0
            : Math.round((totals.current / totals.target) * 100);

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
        // Note: Resources are currently global (not user-scoped)
        // TODO: Add createdBy field to Resource model if user-scoping is needed
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
        // Note: Resources are currently global (not user-scoped)
        // TODO: Add createdBy field to Resource model if user-scoping is needed
        await ctx.db.resource.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  },

  questions: {
    // Generate questions for specific skills (protected)
    generateForSkills: protectedProcedure
      .input(
        z.object({
          assessmentId: z.string().uuid(),
          skillIds: z.array(z.string().uuid()),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // 1. Fetch assessment for context
        const assessment = await ctx.db.assessment.findUnique({
          where: { id: input.assessmentId, userId: ctx.user.id },
        });

        if (!assessment) throw new Error("Assessment not found");

        // 2. Fetch the requested skills
        const skillsToTest = await ctx.db.skill.findMany({
          where: { id: { in: input.skillIds } },
          select: { id: true, name: true, category: true },
        });

        if (skillsToTest.length === 0) {
          return [];
        }

        const result = await generateQuestions({
          skills: skillsToTest,
          context: {
            currentRole: assessment.currentRole || "Unknown",
            targetRole: assessment.targetRole || "Unknown",
            industry: assessment.industry,
          },
        });

        // 4. Map AI response to Question objects (adding missing UI fields)
        // Note: We don't save questions to DB yet, they are ephemeral for the test session
        // unless you want to cache them. For now, we generate on-the-fly.

        return result.questions.map((q) => {
          const skill = skillsToTest.find((s) => s.id === q.skillId);
          return {
            id: crypto.randomUUID(), // Ephemeral ID for the UI
            ...q,
            skillName: skill?.name || "Unknown Skill",
            category:
              (skill?.category.toLowerCase() as "hard" | "soft") || "hard",
          };
        });
      }),
  },

  evidence: {
    // Upload / register an evidence item (protected)
    create: protectedProcedure
      .input(
        z.object({
          provider: z.string().optional(),
          referenceUrl: z.string().url().optional(),
          retentionDays: z.number().int().min(0).max(365).optional(),
          allowRawStorage: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        const now = new Date();
        const retentionDays = input.retentionDays ?? 0;
        const retentionUntil =
          retentionDays > 0
            ? new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000)
            : null;
        const allowRaw = Boolean(input.allowRawStorage);

        // Run lightweight evidence processing
        const { signals, rawStored } = await processEvidence({
          provider: input.provider,
          referenceUrl: input.referenceUrl,
          allowRawStorage: allowRaw,
        });

        const ev = await ctx.db.evidence.create({
          data: {
            userId: ctx.user.id,
            provider: input.provider,
            referenceUrl: input.referenceUrl,
            signals: signals as never,
            rawStored,
            retentionUntil,
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
        // Ensure user can only delete their own evidence
        await ctx.db.evidence.delete({
          where: { id: input.id, userId: ctx.user.id },
        });
        return { ok: true };
      }),

    // Connect GitHub: Fetch user's repos using their OAuth token and create evidence
    connectGithub: protectedProcedure
      .input(
        z.object({
          retentionDays: z.number().int().min(0).max(365).optional(),
          allowRawStorage: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // 1. Get user's GitHub OAuth account to retrieve access token
        const account = await ctx.db.account.findFirst({
          where: {
            userId: ctx.user.id,
            providerId: "github",
          },
        });

        if (!account || !account.accessToken) {
          throw new Error(
            "No GitHub account linked. Please log in with GitHub first."
          );
        }

        // 2. Fetch user's public repos from GitHub API
        const reposRes = await fetch(
          "https://api.github.com/user/repos?type=owner&sort=updated&per_page=20",
          {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!reposRes.ok) {
          throw new Error(`GitHub API error: ${reposRes.status}`);
        }

        const repos = (await reposRes.json()) as Array<{
          full_name: string;
          name: string;
          description: string | null;
          language: string | null;
          stargazers_count: number;
          forks_count: number;
          topics?: string[];
        }>;

        // 3. Extract signals: languages used, total stars, matched skills
        const languageCounts: Record<string, number> = {};
        let totalStars = 0;
        const repoSummaries: Array<{
          name: string;
          language: string | null;
          stars: number;
        }> = [];

        for (const repo of repos) {
          if (repo.language) {
            languageCounts[repo.language] =
              (languageCounts[repo.language] || 0) + 1;
          }
          totalStars += repo.stargazers_count;
          repoSummaries.push({
            name: repo.full_name,
            language: repo.language,
            stars: repo.stargazers_count,
          });
        }

        // Sort languages by frequency
        const topLanguages = Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([lang]) => lang);

        // 4. Match repos against skills in DB
        const skills = await ctx.db.skill.findMany();
        const matchedSkills: Array<{ id: string; name: string }> = [];

        // Build searchable text from all repos
        const allText = repos
          .map(
            (r) =>
              `${r.name} ${r.description || ""} ${r.language || ""} ${
                r.topics?.join(" ") || ""
              }`
          )
          .join(" ")
          .toLowerCase();

        for (const skill of skills) {
          const skillName = skill.name.toLowerCase();
          if (
            allText.includes(skillName) ||
            (skill.domain && allText.includes(skill.domain.toLowerCase()))
          ) {
            matchedSkills.push({ id: skill.id, name: skill.name });
          }
        }

        // 5. Build signals object
        const signals = {
          provider: "github",
          extractedAt: new Date().toISOString(),
          github: {
            repoCount: repos.length,
            totalStars,
            topLanguages,
            topRepos: repoSummaries.slice(0, 5),
          },
          matchedSkills,
        };

        // 6. Calculate retention
        const retentionDays = input.retentionDays ?? 0;
        const retentionUntil =
          retentionDays > 0
            ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
            : null;

        // 7. Create evidence record
        const evidence = await ctx.db.evidence.create({
          data: {
            userId: ctx.user.id,
            provider: "github",
            signals: signals as never,
            rawStored: Boolean(input.allowRawStorage),
            retentionUntil,
          },
        });

        return {
          success: true,
          evidenceId: evidence.id,
          summary: {
            repoCount: repos.length,
            totalStars,
            topLanguages,
            matchedSkillsCount: matchedSkills.length,
          },
        };
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

    // Get CV settings for the current user
    getCvSettings: protectedProcedure.handler(async ({ context }) => {
      const ctx = context as AuthenticatedContext;
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { cvUrl: true, useCvForAnalysis: true },
      });
      return {
        cvUrl: user?.cvUrl ?? null,
        useCvForAnalysis: user?.useCvForAnalysis ?? false,
      };
    }),

    // Upload CV file to R2 and save URL to user
    uploadCv: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileType: z.string(),
          fileBase64: z.string(),
          fileSize: z.number(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // Import R2 functions dynamically to avoid client-side issues
        const { uploadResumeToR2 } = await import("@/lib/services/r2-storage");

        // Convert base64 to File object
        const binaryString = atob(input.fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: input.fileType });
        const file = new File([blob], input.fileName, { type: input.fileType });

        // Upload to R2
        const cvUrl = await uploadResumeToR2(file, ctx.user.id);

        // Update user with new CV URL
        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { cvUrl },
        });

        return { success: true, cvUrl };
      }),

    // Delete CV from R2 and clear user's cvUrl
    deleteCv: protectedProcedure.handler(async ({ context }) => {
      const ctx = context as AuthenticatedContext;

      // Get current CV URL
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { cvUrl: true },
      });

      if (user?.cvUrl) {
        // Import R2 functions dynamically
        const { deleteResumeFromR2 } = await import(
          "@/lib/services/r2-storage"
        );
        await deleteResumeFromR2(user.cvUrl);
      }

      // Clear CV URL from user
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { cvUrl: null },
      });

      return { success: true };
    }),

    // Update user profile (including CV preference)
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          useCvForAnalysis: z.boolean().optional(),
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

  gaps: {
    // Check if gaps analysis already exists for an assessment
    checkStatus: protectedProcedure
      .input(z.object({ assessmentId: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;
        const assessment = await ctx.db.assessment.findFirst({
          where: { id: input.assessmentId, userId: ctx.user.id },
          include: {
            results: { include: { skill: true } },
            gaps: true,
          },
        });

        if (!assessment) throw new Error("Assessment not found");

        if (assessment.gaps) {
          return {
            hasGaps: true,
            gapsData: {
              assessmentId: assessment.id,
              assessmentGapsId: assessment.gaps.id,
              targetRole: assessment.targetRole,
              readinessScore: assessment.gaps.readinessScore,
              gaps: assessment.gaps.gaps,
              strengths: assessment.gaps.strengths,
              overallRecommendation: assessment.gaps.overallRecommendation,
            },
          };
        }

        // Return skills to analyze
        return {
          hasGaps: false,
          skillsToAnalyze: assessment.results.map((r) => ({
            skillId: r.skillId,
            skillName: r.skill.name,
            currentLevel: r.level,
            category: r.skill.category,
          })),
          targetRole: assessment.targetRole,
        };
      }),

    // Analyze a single skill gap
    analyzeSkill: protectedProcedure
      .input(
        z.object({
          assessmentId: z.uuid(),
          skillId: z.uuid(),
          skillName: z.string(),
          currentLevel: z.number().min(0).max(5),
          category: z.enum(["HARD", "SOFT", "META"]),
          targetRole: z.string(),
          otherSkillsSummary: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        // Verify ownership
        const assessment = await ctx.db.assessment.findFirst({
          where: { id: input.assessmentId, userId: ctx.user.id },
        });
        if (!assessment) throw new Error("Assessment not found");

        // Fetch user's GitHub evidence for validation
        let evidenceSummary: string | undefined;
        const githubEvidence = await ctx.db.evidence.findFirst({
          where: { userId: ctx.user.id, provider: "github" },
          orderBy: { createdAt: "desc" },
        });

        if (githubEvidence?.signals) {
          const signals = githubEvidence.signals as Record<string, unknown>;
          const github = signals.github as
            | {
                repoCount?: number;
                totalStars?: number;
                topLanguages?: string[];
              }
            | undefined;
          const matchedSkills = (
            signals.matchedSkills as Array<{ name: string }>
          )?.map((s) => s.name);

          if (github) {
            // Check if this skill was matched in repos
            const skillMatched = matchedSkills?.some(
              (s) => s.toLowerCase() === input.skillName.toLowerCase()
            );

            evidenceSummary = `GitHub Profile:
- ${github.repoCount ?? 0} public repositories
- ${github.totalStars ?? 0} total stars
- Top languages: ${github.topLanguages?.join(", ") || "None detected"}
- This skill (${input.skillName}) ${
              skillMatched ? "WAS found" : "was NOT found"
            } in user's repositories`;
          }
        }

        // Check if user wants to include CV in analysis
        const userSettings = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { cvUrl: true, useCvForAnalysis: true },
        });

        if (userSettings?.useCvForAnalysis && userSettings?.cvUrl) {
          try {
            const { extractTextFromPdfUrl } = await import(
              "@/lib/services/pdf-extractor"
            );
            const cvText = await extractTextFromPdfUrl(userSettings.cvUrl);

            // Truncate CV text to avoid token limits (max ~12000 chars)
            const truncatedCvText =
              cvText.length > 12000
                ? cvText.substring(0, 12000) + "... [truncated]"
                : cvText;

            const cvEvidence = `\n\nCV/Resume Content:
${truncatedCvText}

> Use this CV content to validate expertise claims and identify relevant experience for ${input.skillName}.`;

            evidenceSummary = evidenceSummary
              ? evidenceSummary + cvEvidence
              : cvEvidence.trim();
          } catch (error) {
            console.error("Failed to extract CV text:", error);
            // Continue without CV if extraction fails
          }
        }

        const result = await analyzeSkillGap({
          skillId: input.skillId,
          skillName: input.skillName,
          currentLevel: input.currentLevel,
          targetRole: input.targetRole,
          skillCategory: input.category,
          otherSkillsSummary: input.otherSkillsSummary,
          evidenceSummary,
        });

        return result;
      }),

    // Save final gaps analysis
    save: protectedProcedure
      .input(
        z.object({
          assessmentId: z.string().uuid(),
          gaps: z.array(
            z.object({
              skillId: z.string().uuid(),
              skillName: z.string(),
              currentLevel: z.number().min(0).max(5),
              targetLevel: z.number().min(0).max(5),
              gapSize: z.number().min(0).max(5),
              impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
              explanation: z.string(),
              recommendedActions: z.array(z.string()),
              estimatedTimeWeeks: z.number().positive(),
              priority: z.number().min(1).max(10),
            })
          ),
          strengths: z.array(z.string()),
          readinessScore: z.number().min(0).max(100),
          overallRecommendation: z.string(),
        })
      )
      .handler(async ({ input, context }) => {
        const ctx = context as AuthenticatedContext;

        const assessment = await ctx.db.assessment.findFirst({
          where: { id: input.assessmentId, userId: ctx.user.id },
          include: {
            results: true,
          },
        });
        if (!assessment) throw new Error("Assessment not found");

        const savedGaps = await ctx.db.assessmentGaps.upsert({
          where: { assessmentId: input.assessmentId },
          create: {
            assessmentId: input.assessmentId,
            readinessScore: input.readinessScore,
            gaps: input.gaps,
            strengths: input.strengths,
            overallRecommendation: input.overallRecommendation,
          },
          update: {
            readinessScore: input.readinessScore,
            gaps: input.gaps,
            strengths: input.strengths,
            overallRecommendation: input.overallRecommendation,
          },
        });

        // Only mark as completed if all skills have been analyzed
        const totalSkills = assessment.results.length;
        const analyzedSkills = input.gaps.length + input.strengths.length;

        if (analyzedSkills >= totalSkills) {
          await ctx.db.assessment.update({
            where: { id: input.assessmentId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
        }

        return { success: true, gapsId: savedGaps.id };
      }),
  },
};

export type Router = typeof router;
