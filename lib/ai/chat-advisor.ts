import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fastModel } from "./models";
import { isDevelopment } from "./utils";

export const ChatResponseSchema = z.object({
  message: z.string().describe("The advisor's response message"),
  suggestions: z
    .array(z.string())
    .describe("List of suggested follow-up questions (can be empty)"),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

interface UserContext {
  userId: string;
  assessmentSummary?: string;
  recentGaps?: Array<{
    skillName: string;
    gapSize: number;
    impact: string;
  }>;
  targetRole?: string;
  history?: string;
}

export async function generateAdvisorResponse(
  userMessage: string,
  context: UserContext,
): Promise<ChatResponse> {
  const contextPrompt = buildContextPrompt(context);

  // Use fastModel (GPT-OSS 20B) for chat - conversational, simpler task
  const aiModel = fastModel;

  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  const { output } = await generateText({
    model,
    output: Output.object({ schema: ChatResponseSchema }),
    prompt: `You are an expert career advisor helping a professional with their skill development and career transition.

${contextPrompt}

**User's Message:**
${userMessage}

**Your Task:**
1. Provide helpful, actionable advice related to their career goals and skill gaps
2. Be empathetic, encouraging, and realistic
3. Suggest concrete next steps when appropriate
4. Optionally provide 2-3 follow-up questions they might want to ask

Keep responses concise (2-3 paragraphs max) and focus on practical guidance.`,
    temperature: 0.7,
  });

  return output;
}

function buildContextPrompt(context: UserContext): string {
  const parts = ["**User Context:**"];

  if (context.targetRole) {
    parts.push(`- Target Role: ${context.targetRole}`);
  }

  if (context.assessmentSummary) {
    parts.push(`- Assessment Summary:\n${context.assessmentSummary}`);
  }

  if (context.recentGaps && context.recentGaps.length > 0) {
    parts.push("- Top Skill Gaps:");
    context.recentGaps.forEach((gap) => {
      parts.push(
        `  • ${gap.skillName}: ${gap.gapSize} level gap (${gap.impact} impact)`,
      );
    });
  }

  if (context.history) {
    parts.push("\n**Recent Conversation History:**");
    parts.push(context.history);
  }

  if (parts.length === 1) {
    parts.push("- The user has not completed an assessment yet");
  }

  return parts.join("\n");
}
