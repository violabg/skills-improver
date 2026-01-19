import type { AuthenticatedContext } from "@/lib/orpc/context";
import { protectedProcedure } from "../procedures";

export const skillHistoryRouter = {
  // Get user's skill history
  get: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    // Get most recent level for each skill
    const history = await ctx.db.userSkillHistory.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: { skill: { select: { name: true, category: true } } },
    });

    // Dedupe to most recent per skill
    const latestBySkill = new Map<string, (typeof history)[0]>();
    for (const h of history) {
      if (!latestBySkill.has(h.skillId)) {
        latestBySkill.set(h.skillId, h);
      }
    }

    return Array.from(latestBySkill.values());
  }),

  // Pre-populate assessment with historical skill levels
  getForAssessment: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    // Get AI-verified skills (highest confidence)
    const verifiedSkills = await ctx.db.userSkillHistory.findMany({
      where: {
        userId: ctx.user.id,
        source: "AI_VERIFIED",
      },
      orderBy: { createdAt: "desc" },
      include: { skill: true },
    });

    // Dedupe to most recent per skill
    const latestBySkill = new Map<
      string,
      { skillId: string; level: number; confidence: number }
    >();
    for (const h of verifiedSkills) {
      if (!latestBySkill.has(h.skillId)) {
        latestBySkill.set(h.skillId, {
          skillId: h.skillId,
          level: h.level,
          confidence: h.confidence,
        });
      }
    }

    return Array.from(latestBySkill.values());
  }),
};
