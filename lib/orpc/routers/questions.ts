import { generateQuestions } from "@/lib/ai";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { authed } from "../procedures";

export const questionsRouter = {
  generateForSkills: authed.questions.generateForSkills.handler(
    async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      const assessment = await ctx.db.assessment.findUnique({
        where: { id: input.assessmentId, userId: ctx.user.id },
      });

      if (!assessment) throw new Error("Assessment not found");

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

      return result.questions.map((q) => {
        const skill = skillsToTest.find((s) => s.id === q.skillId);
        return {
          id: crypto.randomUUID(),
          ...q,
          skillName: skill?.name || "Unknown Skill",
          category:
            (skill?.category.toLowerCase() as "hard" | "soft") || "hard",
        };
      });
    },
  ),
};
