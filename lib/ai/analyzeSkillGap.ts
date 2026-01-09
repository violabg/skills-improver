import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { skillEvaluationModel } from "./models";
import { GapExplanationSchema } from "./schemas/gapExplanation.schema";
import { isDevelopment } from "./utils";

const SingleGapSchema = GapExplanationSchema.extend({
  // Make skillId optional since we provide it
  skillId: z.string().optional(),
});

interface AnalyzeSkillGapInput {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetRole: string;
  skillCategory: "HARD" | "SOFT" | "META";
  otherSkillsSummary?: string;
}

export interface SkillGapResult {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
}

/**
 * Analyze a single skill gap with AI.
 * This is called for each assessed skill individually to ensure all are analyzed.
 */
export async function analyzeSkillGap(
  input: AnalyzeSkillGapInput
): Promise<SkillGapResult> {
  const prompt = buildSingleSkillPrompt(input);

  const aiModel = skillEvaluationModel;

  const devToolsEnabledModel = wrapLanguageModel({
    model: aiModel,
    middleware: devToolsMiddleware(),
  });

  try {
    const { output } = await generateText({
      model: isDevelopment ? devToolsEnabledModel : aiModel,
      output: Output.object({ schema: SingleGapSchema }),
      prompt,
    });

    return {
      skillId: input.skillId,
      skillName: input.skillName,
      currentLevel: output.currentLevel ?? input.currentLevel,
      targetLevel: output.targetLevel ?? 4,
      gapSize:
        output.gapSize ??
        Math.max(0, (output.targetLevel ?? 4) - input.currentLevel),
      impact: output.impact,
      explanation: output.explanation,
      recommendedActions: output.recommendedActions,
      estimatedTimeWeeks: output.estimatedTimeWeeks,
      priority: output.priority,
    };
  } catch (error) {
    console.error(`Gap analysis failed for ${input.skillName}:`, error);

    // Fallback: calculate basic gap
    const targetLevel = 4;
    const gapSize = Math.max(0, targetLevel - input.currentLevel);

    return {
      skillId: input.skillId,
      skillName: input.skillName,
      currentLevel: input.currentLevel,
      targetLevel,
      gapSize,
      impact:
        gapSize > 2
          ? "CRITICAL"
          : gapSize > 1
          ? "HIGH"
          : gapSize > 0
          ? "MEDIUM"
          : "LOW",
      explanation: `${input.skillName} needs improvement for ${input.targetRole}.`,
      recommendedActions: [`Focus on improving ${input.skillName}`],
      estimatedTimeWeeks: gapSize * 2,
      priority: 10 - gapSize,
    };
  }
}

function buildSingleSkillPrompt(input: AnalyzeSkillGapInput): string {
  return `You are a senior career advisor analyzing a single skill gap for career progression.

**Target Role:** ${input.targetRole}

**Skill Being Analyzed:**
- Name: ${input.skillName}
- Category: ${input.skillCategory}
- Current Level: ${input.currentLevel}/5

${
  input.otherSkillsSummary
    ? `**Other Skills Context:**\n${input.otherSkillsSummary}\n`
    : ""
}

**Your Task:**
1. Determine the target level (1-5) needed for this skill in the target role
2. Calculate the gap size (target - current, minimum 0)
3. Assess impact on career progression (LOW, MEDIUM, HIGH, CRITICAL)
4. Explain why this skill matters for the target role
5. Provide 2-3 specific, actionable recommendations to close the gap
6. Estimate weeks to close the gap
7. Assign priority (1-10, with 1 being highest priority)

**Evaluation Criteria:**
- For ${input.targetRole}, what level of ${input.skillName} is required?
- How critical is this skill for success in this role?
- What specific actions will help close this gap?

Be realistic, specific, and actionable.`;
}
