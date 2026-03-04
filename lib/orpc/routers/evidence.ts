import type { AuthenticatedContext } from "@/lib/orpc/context";
import { processEvidence } from "@/lib/services/evidenceProcessor";
import { authed } from "../procedures";

export const evidenceRouter = {
  create: authed.evidence.create.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const now = new Date();
    const retentionDays = input.retentionDays ?? 0;
    const retentionUntil =
      retentionDays > 0
        ? new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000)
        : null;
    const allowRaw = Boolean(input.allowRawStorage);

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

  list: authed.evidence.list.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;
    const items = await ctx.db.evidence.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
    return items;
  }),

  get: authed.evidence.get.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    const ev = await ctx.db.evidence.findFirst({
      where: { id: input.id, userId: ctx.user.id },
    });
    if (!ev) throw new Error("Evidence not found");
    return ev;
  }),

  delete: authed.evidence.delete.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    await ctx.db.evidence.delete({
      where: { id: input.id, userId: ctx.user.id },
    });
    return { ok: true };
  }),

  connectGithub: authed.evidence.connectGithub.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const account = await ctx.db.account.findFirst({
        where: {
          userId: ctx.user.id,
          providerId: "github",
        },
      });

      if (!account || !account.accessToken) {
        throw new Error(
          "No GitHub account linked. Please log in with GitHub first.",
        );
      }

      const headers = {
        Authorization: `Bearer ${account.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      };

      const reposRes = await fetch(
        "https://api.github.com/user/repos?type=owner&sort=updated&per_page=30",
        { headers },
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

      const languageCounts: Record<string, number> = {};
      let totalStars = 0;
      const repoSummaries: Array<{
        name: string;
        language: string | null;
        stars: number;
        description?: string | null;
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
          description: repo.description,
        });
      }

      const topLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      let totalCommits = 0;
      let avgPerWeek = 0;
      let consistencyScore = 0;

      try {
        const topRepoNames = repos.slice(0, 3).map((r) => r.full_name);
        const weeklyCommits: number[] = [];

        for (const repoName of topRepoNames) {
          const statsRes = await fetch(
            `https://api.github.com/repos/${repoName}/stats/participation`,
            { headers },
          );
          if (statsRes.ok) {
            const stats = (await statsRes.json()) as { owner: number[] };
            if (stats.owner) {
              stats.owner.forEach((count, i) => {
                weeklyCommits[i] = (weeklyCommits[i] || 0) + count;
              });
            }
          }
        }

        if (weeklyCommits.length > 0) {
          totalCommits = weeklyCommits.reduce((a, b) => a + b, 0);
          avgPerWeek = totalCommits / weeklyCommits.length;
          const activeWeeks = weeklyCommits.filter((c) => c > 0).length;
          consistencyScore = activeWeeks / weeklyCommits.length;
        }
      } catch (e) {
        console.warn("Failed to fetch GitHub stats:", e);
      }

      const skills = await ctx.db.skill.findMany();
      const availableSkills = skills.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
      }));

      const { analyzeGithub } = await import("@/lib/ai/analyzeGithub");
      const aiAnalysis = await analyzeGithub({
        profileData: {
          repoCount: repos.length,
          totalStars,
          topLanguages,
          topRepos: repoSummaries.slice(0, 10),
          commitActivity: {
            totalCommits,
            avgPerWeek,
            consistencyScore,
          },
        },
        targetRole: input.targetRole,
        availableSkills,
      });

      const signals = {
        provider: "github",
        extractedAt: new Date().toISOString(),
        github: {
          repoCount: repos.length,
          totalStars,
          topLanguages,
          topRepos: repoSummaries.slice(0, 5),
          commitActivity: {
            totalCommits,
            avgPerWeek: Math.round(avgPerWeek * 10) / 10,
            consistencyScore: Math.round(consistencyScore * 100) / 100,
          },
        },
        aiAnalysis: {
          inferredSkills: aiAnalysis.inferredSkills,
          strengths: aiAnalysis.strengths,
          recommendations: aiAnalysis.recommendations,
          overallAssessment: aiAnalysis.overallAssessment,
          estimatedExperienceLevel: aiAnalysis.estimatedExperienceLevel,
        },
      };

      const retentionDays = input.retentionDays ?? 0;
      const retentionUntil =
        retentionDays > 0
          ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
          : null;

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
          commitActivity: {
            totalCommits,
            avgPerWeek: Math.round(avgPerWeek * 10) / 10,
            consistencyScore: Math.round(consistencyScore * 100) / 100,
          },
        },
        aiAnalysis: {
          inferredSkillsCount: aiAnalysis.inferredSkills.length,
          estimatedLevel: aiAnalysis.estimatedExperienceLevel,
          strengths: aiAnalysis.strengths,
        },
      };
    },
  ),
};
