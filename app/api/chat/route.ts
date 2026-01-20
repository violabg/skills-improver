import { fastModel } from "@/lib/ai/models";
import { isDevelopment } from "@/lib/ai/utils";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import {
  convertToModelMessages,
  streamText,
  wrapLanguageModel,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";

export const maxDuration = 30;

export async function POST(req: Request) {
  // Authenticate user
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  // If chatId provided, verify ownership
  if (chatId) {
    const conversation = await db.chatConversation.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }
  }

  // Get the latest user message for context building
  const userMessage = messages.findLast((m) => m.role === "user");
  const userMessageText =
    userMessage?.parts?.find((p) => p.type === "text")?.text ?? "";

  // Fetch user's most recent completed assessment for context
  const latestAssessment = await db.assessment.findFirst({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
    include: {
      results: {
        include: { skill: true },
        take: 5,
      },
    },
  });

  // Build context prompt
  const contextParts: string[] = ["**User Context:**"];

  if (latestAssessment) {
    if (latestAssessment.targetRole) {
      contextParts.push(`- Target Role: ${latestAssessment.targetRole}`);
    }

    const resultSummary = latestAssessment.results
      .map(
        (r) =>
          `${r.skill.name}: Level ${r.level}/5 (${Math.round(r.confidence * 100)}% confidence)`,
      )
      .join("\n");

    if (resultSummary) {
      contextParts.push(`- Assessment Summary:\n${resultSummary}`);
    }

    // Calculate top gaps
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

    if (gaps.length > 0) {
      contextParts.push("- Top Skill Gaps:");
      gaps.forEach((g) => {
        const impact =
          g.gapSize > 2 ? "CRITICAL" : g.gapSize > 1 ? "HIGH" : "MEDIUM";
        contextParts.push(
          `  • ${g.skillName}: ${g.gapSize} level gap (${impact} impact)`,
        );
      });
    }
  } else {
    contextParts.push("- The user has not completed an assessment yet");
  }

  // Get recent mentor history for context
  const recentHistory = await db.mentorInteraction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (recentHistory.length > 0) {
    contextParts.push("\n**Recent Conversation History:**");
    const historyContext = recentHistory
      .reverse()
      .map(
        (h) =>
          `User: ${h.userMessage ?? "(system)"}\nMentor: ${h.mentorMessage}`,
      )
      .join("\n\n");
    contextParts.push(historyContext);
  }

  const contextPrompt = contextParts.join("\n");

  // Setup model with optional devtools
  const aiModel = fastModel;
  const model = isDevelopment
    ? wrapLanguageModel({ model: aiModel, middleware: devToolsMiddleware() })
    : aiModel;

  // Stream the response
  const result = streamText({
    model,
    system: `You are an expert career advisor helping a professional with their skill development and career transition.

${contextPrompt}

**Your Task:**
1. Provide helpful, actionable advice related to their career goals and skill gaps
2. Be empathetic, encouraging, and realistic
3. Suggest concrete next steps when appropriate
4. Keep responses concise (2-3 paragraphs max) and focus on practical guidance`,
    messages: await convertToModelMessages(messages),
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages }) => {
      // Save interaction to database
      await db.mentorInteraction.create({
        data: {
          userId: session.user.id,
          type: "QUESTION",
          userMessage: userMessageText,
          mentorMessage:
            allMessages
              .findLast((m) => m.role === "assistant")
              ?.parts?.find((p) => p.type === "text")?.text ?? "",
          context: { contextPrompt },
        },
      });

      // Persist messages to conversation if chatId provided
      if (chatId) {
        // Generate title from first user message if not set
        const firstUserMsg = allMessages.find((m) => m.role === "user");
        const titleText =
          firstUserMsg?.parts?.find((p) => p.type === "text")?.text ?? "";
        const title =
          titleText.length > 50 ? titleText.slice(0, 50) + "..." : titleText;

        await db.chatConversation.update({
          where: { id: chatId },
          data: {
            messages: allMessages as unknown as object[],
            title: title || "New conversation",
            updatedAt: new Date(),
          },
        });
      }
    },
  });
}
