import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { skillEvaluationModel } from "./models";
import {
  SkillEvaluationSchema,
  type SkillEvaluation,
} from "./schemas/skillEvaluation.schema";
import { isDevelopment } from "./utils";

interface AssessSkillInput {
  skillId: string;
  skillName: string;
  skillCategory: "HARD" | "SOFT" | "META";
  question: string;
  answer: string;
  context?: string;
}

export async function assessSkill(
  input: AssessSkillInput
): Promise<SkillEvaluation> {
  const prompt = buildAssessmentPrompt(input);

  const aiModel = skillEvaluationModel;

  const devToolsEnabledModel = wrapLanguageModel({
    model: aiModel,
    middleware: devToolsMiddleware(),
  });

  try {
    const { output } = await generateText({
      model: isDevelopment ? devToolsEnabledModel : aiModel,
      output: Output.object({ schema: SkillEvaluationSchema }),
      prompt,
      maxRetries: 5,
    });

    // Ensure skillId matches input
    return {
      ...output,
      skillId: input.skillId,
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);

    // Fallback to heuristic evaluation
    return {
      skillId: input.skillId,
      level: 2, // Conservative fallback
      confidence: 0.3, // Low confidence for fallback
      notes: "AI evaluation failed. Manual review required.",
      strengths: [],
      weaknesses: ["Unable to perform automated evaluation"],
    };
  }
}

function buildAssessmentPrompt(input: AssessSkillInput): string {
  const categoryGuidance = {
    HARD: "Focus on technical accuracy, depth of understanding, and practical application. Consider code quality, best practices, and problem-solving approach.",
    SOFT: "Evaluate communication clarity, emotional intelligence, interpersonal skills, and situational judgment. Consider maturity, empathy, and practical wisdom.",
    META: "Assess strategic thinking, self-awareness, learning ability, and adaptability. Consider growth mindset and meta-cognitive skills.",
  };

  return `You are a senior career assessor evaluating a professional's skill level.

**Skill Being Assessed:** ${input.skillName}
**Skill Category:** ${input.skillCategory}
${input.context ? `**Additional Context:** ${input.context}` : ""}

**Assessment Question:**
${input.question}

**Candidate's Response:**
${input.answer}

**Evaluation Guidelines:**
${categoryGuidance[input.skillCategory]}

**Skill Level Scale:**
- 0: No knowledge or understanding
- 1: Awareness level - knows it exists, basic concepts
- 2: Beginner - can use with guidance, limited experience
- 3: Intermediate - practical working knowledge, some autonomy
- 4: Advanced - deep understanding, can teach others, solves complex problems
- 5: Expert - mastery level, innovates, recognized authority

**Your Task:**
Objectively evaluate the candidate's response and provide:
1. A skill level (0-5) based on the response quality
2. Your confidence in this evaluation (0-1)
3. Detailed notes explaining your reasoning
4. Specific strengths demonstrated
5. Specific weaknesses or gaps identified

Be honest and constructive. Focus on observable evidence in the response.`;
}
