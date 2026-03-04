import type { AuthenticatedContext } from "@/lib/orpc/context";
import { authed } from "../procedures";

export const skillHistoryRouter = {
  get: authed.skillHistory.get.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    const history = await ctx.db.userSkillHistory.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: { skill: { select: { name: true, category: true } } },
    });

    const latestBySkill = new Map<string, (typeof history)[0]>();
    for (const h of history) {
      if (!latestBySkill.has(h.skillId)) {
        latestBySkill.set(h.skillId, h);
      }
    }

    return Array.from(latestBySkill.values());
  }),

  getForAssessment: authed.skillHistory.getForAssessment.handler(
    async ({ context }) => {
      const ctx = context as AuthenticatedContext;

      const verifiedSkills = await ctx.db.userSkillHistory.findMany({
        where: {
          userId: ctx.user.id,
          source: "AI_VERIFIED",
        },
        orderBy: { createdAt: "desc" },
        include: { skill: true },
      });

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
    },
  ),
};
