import { generateText, Output } from "ai";
import { gapAnalysisModel } from "./models";
import {
  ResourceListSchema,
  type ResourceRecommendation,
} from "./schemas/resourceRecommendation.schema";

interface RecommendResourcesInput {
  skillId: string;
  skillName: string;
  skillCategory: "HARD" | "SOFT" | "META";
  currentLevel: number;
  targetLevel: number;
  context?: string;
}

export async function recommendResources(
  input: RecommendResourcesInput
): Promise<ResourceRecommendation[]> {
  const prompt = buildResourcePrompt(input);

  try {
    const { output } = await generateText({
      model: gapAnalysisModel,
      output: Output.object({ schema: ResourceListSchema }),
      prompt,
    });

    return output.recommendations;
  } catch (error) {
    console.error("Resource recommendation failed:", error);

    // Fallback to generic recommendations
    return [
      {
        title: "Official Documentation",
        provider: "Official",
        url: "https://example.com",
        type: "ARTICLE",
        cost: "FREE",
        estimatedTimeMinutes: 120,
        difficulty: "INTERMEDIATE",
        relevanceScore: 0.8,
        description: "Review official documentation for this skill",
      },
    ];
  }
}

function buildResourcePrompt(input: RecommendResourcesInput): string {
  const levelGap = input.targetLevel - input.currentLevel;
  const progressDescription =
    levelGap <= 0
      ? "Skills already at target level"
      : levelGap === 1
      ? "Minor improvement needed"
      : levelGap === 2
      ? "Moderate learning required"
      : "Significant learning effort needed";

  return `You are a learning path advisor recommending resources for skill development.

**Skill:** ${input.skillName}
**Category:** ${input.skillCategory}
**Current Level:** ${input.currentLevel}/5
**Target Level:** ${input.targetLevel}/5
**Progress Required:** ${progressDescription}
${input.context ? `**Context:** ${input.context}` : ""}

**Your Task:**
Recommend the 5 best learning resources (courses, books, tutorials, videos, practice platforms) that would help someone progress from level ${
    input.currentLevel
  } to level ${input.targetLevel} in ${input.skillName}.

**Requirements:**
1. Prioritize free or low-cost options
2. Include a mix of learning formats (video, article, course, book, practice)
3. Suggest resources in logical progression order
4. Focus on practical, hands-on learning
5. Include estimated time commitment

**Recommended Providers:**
- Coursera, edX, Udemy (for structured courses)
- YouTube, Dev.to, Medium (for articles and tutorials)
- Codecademy, LeetCode, HackerRank (for practice)
- FreeCodeCamp, Khan Academy (for free structured learning)
- LinkedIn Learning (for professional development)
- O'Reilly Books (for deep dives)

Each resource should have:
- A relevant, descriptive title
- The platform/provider name
- Direct URL to the resource
- Type (COURSE, VIDEO, ARTICLE, BOOK, TUTORIAL, PRACTICE)
- Cost category (FREE, FREEMIUM, PAID)
- Estimated time in minutes
- Difficulty level
- Relevance score (0-1, how directly relevant to this skill)
- Brief description of what it covers

Order recommendations by relevance score and logical learning progression.`;
}
