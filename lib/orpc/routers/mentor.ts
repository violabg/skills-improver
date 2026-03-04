import { generateAdvisorResponse } from "@/lib/ai/chat-advisor";
import type { AuthenticatedContext } from "@/lib/orpc/context";
import { authed } from "../procedures";

export const mentorRouter = {
  chat: authed.mentor.chat.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    let roadmapContext = "";
    if (input.roadmapId) {
      const roadmap = await ctx.db.roadmap.findFirst({
        where: { id: input.roadmapId, userId: ctx.user.id },
        include: {
          milestones: { orderBy: { weekNumber: "asc" } },
          assessment: { select: { targetRole: true } },
        },
      });

      if (roadmap) {
        const completedCount = roadmap.milestones.filter(
          (m) => m.status === "COMPLETED",
        ).length;
        const inProgressMilestone = roadmap.milestones.find(
          (m) => m.status === "PENDING" || m.status === "IN_PROGRESS",
        );

        roadmapContext = `
User is on a ${roadmap.totalWeeks}-week roadmap to become ${roadmap.assessment.targetRole}.
Progress: ${completedCount}/${roadmap.milestones.length} milestones completed.
Current focus: ${inProgressMilestone?.title ?? "All milestones complete!"}
`;
      }
    }

    const recentHistory = await ctx.db.mentorInteraction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const historyContext = recentHistory
      .reverse()
      .map(
        (h) =>
          `User: ${h.userMessage ?? "(system)"}\nMentor: ${h.mentorMessage}`,
      )
      .join("\n\n");

    const aiResponse = await generateAdvisorResponse(input.message, {
      userId: ctx.user.id,
      assessmentSummary: roadmapContext,
      history: historyContext,
    });

    await ctx.db.mentorInteraction.create({
      data: {
        userId: ctx.user.id,
        roadmapId: input.roadmapId,
        type: "QUESTION",
        userMessage: input.message,
        mentorMessage: aiResponse.message,
        context: { roadmapContext, historyContext },
      },
    });

    return {
      response: aiResponse.message,
      suggestions: aiResponse.suggestions,
    };
  }),

  getHistory: authed.mentor.getHistory.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;

    const interactions = await ctx.db.mentorInteraction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });

    return interactions.reverse();
  }),
};
