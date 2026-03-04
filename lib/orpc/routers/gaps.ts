import { analyzeSkillGap } from "@/lib/ai";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { Resource } from "../../prisma/client";
import { authed } from "../procedures";

export const gapsRouter = {
  checkStatus: authed.gaps.checkStatus.handler(async ({ input, context }) => {
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

  analyzeSkill: authed.gaps.analyzeSkill.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const assessment = await ctx.db.assessment.findFirst({
      where: { id: input.assessmentId, userId: ctx.user.id },
    });
    if (!assessment) throw new Error("Assessment not found");

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

    const userSettings = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { cvUrl: true, useCvForAnalysis: true },
    });

    if (userSettings?.useCvForAnalysis && userSettings?.cvUrl) {
      try {
        const { extractTextFromPdfUrl } =
          await import("@/lib/services/pdf-extractor");
        const cvText = await extractTextFromPdfUrl(userSettings.cvUrl);

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

  save: authed.gaps.save.handler(async ({ input, context }) => {
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

  get: authed.gaps.get.handler(async ({ input, context }) => {
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

    const allSkills = await ctx.db.skill.findMany({
      where: { assessable: true },
    });

    const resultsMap = new Map(assessment.results.map((r) => [r.skillId, r]));

    const evaluatedSkills = allSkills.filter((skill) =>
      resultsMap.has(skill.id),
    );

    const gaps = evaluatedSkills.map((skill) => {
      const result = resultsMap.get(skill.id)!;
      const currentLevel = result.level;

      const yearsExp = assessment.yearsExperience;
      const careerIntent = assessment.careerIntent;
      const industry = assessment.industry;

      const experienceAdjustment =
        yearsExp === "0-2" ? -1 : yearsExp === "10+" ? 1 : 0;

      const isLeadershipIntent = careerIntent === "LEADERSHIP";
      const isSwitchIntent = careerIntent === "SWITCH";

      const leadershipRole =
        isLeadershipIntent ||
        assessment.targetRole?.toLowerCase().includes("lead") ||
        assessment.targetRole?.toLowerCase().includes("manager");

      let categoryWeight = 1;
      if (skill.category === "SOFT" || skill.category === "META") {
        categoryWeight = isLeadershipIntent ? 1.4 : leadershipRole ? 1.2 : 1;
      } else if (skill.category === "HARD") {
        categoryWeight = isSwitchIntent ? 1.3 : 1;
      }

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

    const userEvidence = await ctx.db.evidence.findMany({
      where: { userId: ctx.user.id },
    });

    const skillIds = gaps.map((g) => g.skillId);
    let resourceLinks: Array<{ skillId: string; resource: Resource }> = [];

    const resourceSkills = await ctx.db.resourceSkill.findMany({
      where: { skillId: { in: skillIds } },
      include: { resource: true },
    });
    resourceLinks = resourceSkills.map((rs) => ({
      skillId: rs.skillId,
      resource: rs.resource,
    }));

    const resourcesBySkill = new Map<string, Array<Resource>>();
    for (const link of resourceLinks) {
      const arr = resourcesBySkill.get(link.skillId) || [];
      const exists = arr.some((r) => {
        if (link.resource.url && r.url === link.resource.url) return true;
        if (link.resource.title && r.title === link.resource.title) return true;
        return false;
      });
      if (!exists) {
        arr.push(link.resource);
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

    gaps.sort((a, b) => b.priority - a.priority);

    const readinessTotals = evaluatedSkills.reduce(
      (acc, skill) => {
        const res = resultsMap.get(skill.id)!;
        const baseTarget = skill.difficulty ?? 3;

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

        let categoryWeight = 1;
        if (skill.category === "SOFT" || skill.category === "META") {
          categoryWeight = isLeadershipIntent ? 1.4 : leadershipRole ? 1.2 : 1;
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
        : Math.round((readinessTotals.current / readinessTotals.target) * 100);

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
