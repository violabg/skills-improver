import type { AuthenticatedContext } from "@/lib/orpc/context";
import { processEvidence } from "@/lib/services/evidenceProcessor";
import { z } from "zod";
import { protectedProcedure } from "../procedures";

export const evidenceRouter = {
  // Upload / register an evidence item (protected)
  create: protectedProcedure
    .input(
      z.object({
        provider: z.string().optional(),
        referenceUrl: z.string().url().optional(),
        retentionDays: z.number().int().min(0).max(365).optional(),
        allowRawStorage: z.boolean().optional(),
      }),
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
      }),
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
          "No GitHub account linked. Please log in with GitHub first.",
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
        },
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
            }`,
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
};
