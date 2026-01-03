import { generateText, Output } from "ai";
import { gapAnalysisModel } from "./models";
import {
  GapAnalysisSchema,
  type GapAnalysis,
} from "./schemas/gapExplanation.schema";

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

  try {
    const { output } = await generateText({
      model: gapAnalysisModel,
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
1. Analyze which skills are critical for success in the target role
2. Identify skill gaps ranked by impact on career progression
3. For each gap, explain why it matters and how to close it
4. Calculate overall readiness as a percentage (0-100)
5. List skills where the candidate is already at target level
6. Provide strategic guidance for career transition

**Evaluation Criteria:**
- Hard skills: Technical competence and tooling knowledge
- Soft skills: Communication, leadership, collaboration
- Meta skills: Learning ability, adaptability, self-awareness

Be realistic, constructive, and data-driven. Rank gaps by impact, not just by size.
Focus on the 5 most critical gaps for success in this role.`;
}
