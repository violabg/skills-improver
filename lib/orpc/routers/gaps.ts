import { analyzeSkillGap } from "@/lib/ai";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { z } from "zod";
import { Resource } from "../../prisma/client";
import { protectedProcedure } from "../procedures";

export const gapsRouter = {
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
      }),
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
            (s) => s.toLowerCase() === input.skillName.toLowerCase(),
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
          const { extractTextFromPdfUrl } =
            await import("@/lib/services/pdf-extractor");
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
          }),
        ),
        strengths: z.array(z.string()),
        readinessScore: z.number().min(0).max(100),
        overallRecommendation: z.string(),
      }),
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

  // NOTE: getGaps was originally in skills: { getGaps: ... }
  // Moving it here to gaps sub-router
  get: protectedProcedure
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

      if (!assessment.targetRole) {
        throw new Error("Assessment has no target role");
      }

      // Get all skills and their target levels
      const allSkills = await ctx.db.skill.findMany({
        where: { assessable: true },
      });

      // Build assessment results map
      const resultsMap = new Map(assessment.results.map((r) => [r.skillId, r]));

      // Calculate gaps using profile data for personalization
      // Only include skills that were actually evaluated by the user
      const evaluatedSkills = allSkills.filter((skill) =>
        resultsMap.has(skill.id),
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
          categoryWeight = isLeadershipIntent ? 1.4 : leadershipRole ? 1.2 : 1;
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
                  : 0),
            ),
          ),
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
          estimatedTimeWeeks: Math.max(1, Math.ceil(gapSize * categoryWeight)),
          priority: Math.round(gapSize * categoryWeight * 10),
        };
      });

      // Fetch user's evidence items to match against skills (in-memory filter)
      const userEvidence = await ctx.db.evidence.findMany({
        where: { userId: ctx.user.id },
      });

      // Batch fetch ResourceSkill links for all gap skills and attach resources.
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
                args: unknown,
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
        const matchedResources = (resourcesBySkill.get(g.skillId) || []).slice(
          0,
          3,
        );

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
        (g as Record<string, unknown>).evidence = relatedEvidence.map((e) => ({
          id: e.id,
          provider: e.provider,
          referenceUrl: e.referenceUrl,
          signals: e.signals,
          createdAt: e.createdAt,
        }));
      }

      // Sort by priority (highest gap/impact first)
      gaps.sort((a, b) => b.priority - a.priority);

      // Calculate readiness score weighted by target levels (using same profile-aware logic)
      const readinessTotals = evaluatedSkills.reduce(
        (acc, skill) => {
          const res = resultsMap.get(skill.id)!;
          const baseTarget = skill.difficulty ?? 3;

          // Extract profile data for personalization
          const yearsExp = assessment.yearsExperience;
          const careerIntent = assessment.careerIntent;

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
                    : 0),
              ),
            ),
          );
          const weightedTarget = targetLevel * categoryWeight;
          const weightedCurrent =
            Math.min(targetLevel, res.level) * categoryWeight;
          acc.target += weightedTarget;
          acc.current += weightedCurrent;
          return acc;
        },
        { target: 0, current: 0 },
      );
      const readinessScore =
        readinessTotals.target === 0
          ? 0
          : Math.round(
              (readinessTotals.current / readinessTotals.target) * 100,
            );

      return {
        assessmentId: input.assessmentId,
        targetRole: assessment.targetRole,
        readinessScore,
        gaps,
        strengths: gaps.filter((g) => g.gapSize === 0).map((g) => g.skillName),
        overallRecommendation: `You are ${readinessScore}% ready for ${assessment.targetRole}. Focus on the top priorities to accelerate your transition.`,
      };
    }),
};
