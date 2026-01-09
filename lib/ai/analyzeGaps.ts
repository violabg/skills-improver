import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { gapAnalysisModel } from "./models";
import {
  GapAnalysisSchema,
  type GapAnalysis,
} from "./schemas/gapExplanation.schema";
import { isDevelopment } from "./utils";

interface AnalyzeGapsInput {
  targetRole: string;
  assessmentSummary: string;
  allSkills: Array<{
    id: string;
    name: string;
    category: "HARD" | "SOFT" | "META";
    difficulty?: number;
  }>;
  context?: string;
}

export async function analyzeGaps(
  input: AnalyzeGapsInput
): Promise<GapAnalysis> {
  const prompt = buildGapAnalysisPrompt(input);

  const aiModel = gapAnalysisModel;

  const devToolsEnabledModel = wrapLanguageModel({
    model: aiModel,
    middleware: devToolsMiddleware(),
  });

  try {
    const { output } = await generateText({
      model: isDevelopment ? devToolsEnabledModel : aiModel,
      output: Output.object({ schema: GapAnalysisSchema }),
      prompt,
    });

    return output;
  } catch (error) {
    console.error("Gap analysis failed:", error);

    // Fallback to basic gap analysis
    return {
      assessmentId: "", // Will be filled by caller
      targetRole: input.targetRole,
      readinessScore: 50,
      gaps: [],
      strengths: [],
      overallRecommendation:
        "Unable to perform automated analysis. Please review assessment results manually.",
    };
  }
}

function buildGapAnalysisPrompt(input: AnalyzeGapsInput): string {
  const skillList = input.allSkills
    .map(
      (s) =>
        `- ${s.name} (${s.category} skill, difficulty: ${
          s.difficulty ?? "N/A"
        })`
    )
    .join("\n");

  return `You are a senior career advisor analyzing a professional's readiness for a new role.

**Target Role:** ${input.targetRole}
${input.context ? `**Additional Context:** ${input.context}` : ""}

**Skills Assessed:**
${input.assessmentSummary}

**Available Skills in the System:**
${skillList}

**Your Task:**
1. Analyze EVERY skill from "Skills Assessed" above - do not skip any
2. For skills below target level (gaps): explain why it matters and how to close it
3. For skills at or above target level: include in strengths list
4. Rank gaps by impact on career progression for the target role
5. Calculate overall readiness as a percentage (0-100)
6. Provide strategic guidance for career transition

**IMPORTANT:** Every skill in "Skills Assessed" **MUST** appear either in gaps OR strengths. Do not omit any.

Before submitting your response, double-check that the count of skills in the response is the same as the count of skills in "Skills Assessed", if not, you have made a mistake, and you should re-run the analysis, to include the missing skills.

**Evaluation Criteria:**
- Hard skills: Technical competence and tooling knowledge
- Soft skills: Communication, leadership, collaboration
- Meta skills: Learning ability, adaptability, self-awareness

Be realistic, constructive, and data-driven. Rank gaps by impact, not just by size.`;
}
