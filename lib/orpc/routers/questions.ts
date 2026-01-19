import { generateQuestions } from "@/lib/ai";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure } from "../procedures";

export const questionsRouter = {
  // Generate questions for specific skills (protected)
  generateForSkills: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        skillIds: z.array(z.string().uuid()),
      }),
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
};
