import { generateSkills } from "@/lib/ai";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { authed, pub } from "../procedures";

export const skillsRouter = {
  list: authed.skills.list.handler(async ({ input, context }) => {
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

  generateForProfile: authed.skills.generateForProfile.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const assessment = await ctx.db.assessment.findUnique({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");
      if (!assessment.targetRole)
        throw new Error("Assessment target role not set");

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

      const finalSkillIds = new Set<string>(suggestion.selectedSkillIds);

      for (const newSkill of suggestion.newSkills) {
        const existing = await ctx.db.skill.findFirst({
          where: { name: { equals: newSkill.name, mode: "insensitive" } },
        });

        if (existing) {
          finalSkillIds.add(existing.id);
          continue;
        }

        const created = await ctx.db.skill.create({
          data: {
            name: newSkill.name,
            category: newSkill.category,
            domain: newSkill.domain,
            assessable: true,
            marketRelevance: 0.8,
            difficulty: 3,
          },
        });
        finalSkillIds.add(created.id);
      }

      const skills = await ctx.db.skill.findMany({
        where: { id: { in: Array.from(finalSkillIds) } },
        orderBy: { category: "asc" },
      });

      return {
        skills,
        reasoning: suggestion.reasoning,
      };
    },
  ),

  get: pub.skills.get.handler(async ({ input, context }) => {
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

  getGraph: pub.skills.getGraph.handler(async ({ context }) => {
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
};
