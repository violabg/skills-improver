import { generateText, Output } from "ai";
import { skillEvaluationModel } from "./models"; // Using the same model for now
import {
  SkillSuggestionSchema,
  type SkillSuggestion,
} from "./schemas/skillSuggestion.schema";

interface GenerateSkillsInput {
  currentRole: string;
  targetRole: string;
  industry?: string | null;
  yearsExperience?: string | null;
  careerIntent?: string | null;
  existingSkills: Array<{
    id: string;
    name: string;
    category: string;
    domain: string | null;
  }>;
}

export async function generateSkills(
  input: GenerateSkillsInput
): Promise<SkillSuggestion> {
  const prompt = buildSkillGenerationPrompt(input);

  try {
    const { output } = await generateText({
      model: skillEvaluationModel, // Reusing the Kimi model
      output: Output.object({ schema: SkillSuggestionSchema }),
      prompt,
    });

    return output;
  } catch (error) {
    console.error("AI skill generation failed:", error);

    // Fallback: just return empty selection if AI fails, let user manually search or handle error upstream
    // Ideally we might implement a heuristic fallback here selecting skills based on keyword matching
    return {
      selectedSkillIds: [],
      newSkills: [],
      reasoning: "AI generation failed, please try again or select manually.",
    };
  }
}

function buildSkillGenerationPrompt(input: GenerateSkillsInput): string {
  // Format existing skills for the prompt - compact format to save tokens
  const skillsList = input.existingSkills
    .map(
      (s) => `- [${s.id}] ${s.name} (${s.category}, ${s.domain || "General"})`
    )
    .join("\n");

  return `You are an expert career coach and technical skills assessor.
  
**User Profile:**
- Current Role: ${input.currentRole}
- Target Goal: ${input.targetRole}
- Industry: ${input.industry || "Not specified"}
- Experience: ${input.yearsExperience || "Not specified"}
- Intent: ${input.careerIntent || "Not specified"}

**Your Task:**
Identify the most critical skills this user needs to assess to achieve their goal. You have a database of existing skills, but you can also suggest new ones if critical skills are missing.

1. Select 8-12 EXISTING skills from the list below that are highly relevant.
2. If the user's role is niche or requires specific skills NOT in the list, suggest 1-3 NEW skills.
3. Balance HARD (technical), SOFT (interpersonal), and META (learning/growth) skills.

**Existing Skills Database:**
${skillsList}

**Guidelines:**
- Focus on what is *testable* and *relevant* for the gap between ${
    input.currentRole
  } and ${input.targetRole}.
- For "General" roles, focus on fundamental skills.
- For leadership roles, emphasize Soft/Meta skills.
- Don't suggest new skills if existing ones cover the same concept (e.g. use "React/Frontend Frameworks" instead of suggesting "Next.js" unless strictly necessary).
`;
}
