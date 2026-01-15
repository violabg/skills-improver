import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { fastModel } from "./models";
import {
  QuestionSuggestionSchema,
  type QuestionSuggestion,
} from "./schemas/questionSuggestion.schema";
import { isDevelopment } from "./utils";

interface GenerateQuestionsInput {
  skills: Array<{ id: string; name: string; category: string }>;
  context: {
    currentRole: string;
    targetRole: string;
    industry?: string | null;
  };
}

export async function generateQuestions(
  input: GenerateQuestionsInput
): Promise<QuestionSuggestion> {
  // If no skills to test, return empty
  if (input.skills.length === 0) {
    return { questions: [] };
  }

  const prompt = buildQuestionGenerationPrompt(input);

  // Use fastModel (GPT-OSS 20B) for question generation
  const aiModel = fastModel;

  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: QuestionSuggestionSchema }),
      prompt,
    });

    return output;
  } catch (error) {
    console.error("AI question generation failed:", error);

    // Fallback: return empty questions if AI fails
    // In a production app, we might want a retry mechanism or fallback to static questions
    return { questions: [] };
  }
}

function buildQuestionGenerationPrompt(input: GenerateQuestionsInput): string {
  const skillsList = input.skills
    .map((s) => `- [${s.id}] ${s.name} (${s.category})`)
    .join("\n");

  return `You are a technical interviewer creating assessment questions.

**Candidate Context:**
- Transitioning from: ${input.context.currentRole}
- Target Goal: ${input.context.targetRole}
- Industry: ${input.context.industry || "General"}

**Task:**
Generate ONE assessment question for EACH of the following skills. The question should be challenging but appropriate for someone targeting the goal role.

**Skills to Test:**
${skillsList}

**Question Types:**
- 'code': For HARD skills like React, Python, etc. Ask for a code snippet or refactoring approach.
- 'scenario': For SOFT/META skills or Architecture. Describe a situation and ask how they'd handle it.
- 'explain': For conceptual understanding. Ask them to explain a complex concept or trade-off.

**Guidelines:**
1. Make questions relevant to the candidates's target role (e.g. if targeting "Team Lead", ask about leadership aspects of the skill).
2. If industry is known, frame the scenario within that industry (e.g. "Fintech").
3. Ensure the 'skillId' field matches exactly the ID provided in the list.
4. 'evaluationCriteria' should be brief bullets on what to look for in the answer.
`;
}
