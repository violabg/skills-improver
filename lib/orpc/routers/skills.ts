import { generateSkills } from "@/lib/ai";
import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../procedures";

export const skillsRouter = {
  // Get all skills (public)
  list: protectedProcedure
    .input(
      z
        .object({
          category: z.enum(["HARD", "SOFT", "META"]).optional(),
          domain: z.string().optional(),
        })
        .optional(),
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
      }),
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
      }),
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
};
