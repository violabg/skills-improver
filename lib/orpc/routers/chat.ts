import { generateAdvisorResponse } from "@/lib/ai/chat-advisor";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { authed } from "../procedures";

export const chatRouter = {
  sendMessage: authed.chat.sendMessage.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const latestAssessment = await ctx.db.assessment.findFirst({
      where: {
        userId: ctx.user.id,
        status: "COMPLETED",
      },
      orderBy: {
        completedAt: "desc",
      },
      include: {
        results: {
          include: {
            skill: true,
          },
        },
      },
    });

    const userContext: {
      userId: string;
      assessmentSummary?: string;
      recentGaps?: Array<{
        skillName: string;
        gapSize: number;
        impact: string;
      }>;
      targetRole?: string;
    } = {
      userId: ctx.user.id,
    };

    if (latestAssessment) {
      userContext.targetRole = latestAssessment.targetRole || undefined;

      const resultSummary = latestAssessment.results
        .slice(0, 5)
        .map(
          (r) =>
            `${r.skill.name}: Level ${r.level}/5 (${Math.round(
              r.confidence * 100,
            )}% confidence)`,
        )
        .join("\n");

      userContext.assessmentSummary = resultSummary;

      const gaps = latestAssessment.results
        .map((r) => ({
          skillName: r.skill.name,
          currentLevel: r.level,
          targetLevel: r.skill.difficulty || 3,
          gapSize: Math.max(0, (r.skill.difficulty || 3) - r.level),
        }))
        .filter((g) => g.gapSize > 0)
        .sort((a, b) => b.gapSize - a.gapSize)
        .slice(0, 3);

      userContext.recentGaps = gaps.map((g) => ({
        skillName: g.skillName,
        gapSize: g.gapSize,
        impact: g.gapSize > 2 ? "CRITICAL" : g.gapSize > 1 ? "HIGH" : "MEDIUM",
      }));
    }

    const response = await generateAdvisorResponse(input.message, userContext);

    return response;
  }),
};
