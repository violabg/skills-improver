import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, wrapLanguageModel } from "ai";
import { z } from "zod";
import { aiLogger } from "../services/logger";
import { resourceModel } from "./models";
import { type ResourceRecommendation } from "./schemas/resourceRecommendation.schema";
import { isDevelopment } from "./utils";

// Valid resource types
const VALID_TYPES = [
  "COURSE",
  "VIDEO",
  "ARTICLE",
  "BOOK",
  "TUTORIAL",
  "PRACTICE",
] as const;
type ResourceType = (typeof VALID_TYPES)[number];

// Map AI variations to valid types
function normalizeResourceType(type: string): ResourceType {
  const upper = type.toUpperCase().replace(/[_-]/g, "");

  // Direct matches
  if (VALID_TYPES.includes(upper as ResourceType)) {
    return upper as ResourceType;
  }

  // Map variations
  const typeMap: Record<string, ResourceType> = {
    GUIDE: "ARTICLE",
    DOCUMENTATION: "ARTICLE",
    DOCS: "ARTICLE",
    BLOG: "ARTICLE",
    POST: "ARTICLE",
    VIDEOSERIES: "VIDEO",
    VIDEOCOURSE: "VIDEO",
    YOUTUBE: "VIDEO",
    WORKSHOP: "COURSE",
    BOOTCAMP: "COURSE",
    ONLINECOURSE: "COURSE",
    EXERCISE: "PRACTICE",
    PROJECT: "PRACTICE",
    CHALLENGE: "PRACTICE",
    LAB: "PRACTICE",
    EBOOK: "BOOK",
    HANDBOOK: "BOOK",
    MANUAL: "BOOK",
    HOWTO: "TUTORIAL",
    WALKTHROUGH: "TUTORIAL",
  };

  return typeMap[upper] ?? "ARTICLE"; // Default to ARTICLE
}

// Flexible schema that handles LLM variations
const FlexibleResourceSchema = z.object({
  title: z.string(),
  provider: z.string(),
  url: z.string(),
  type: z.string().transform(normalizeResourceType),
  // Transform cost variations like "FREE (audit)" → "FREE"
  cost: z.string().transform((val) => {
    const upper = val.toUpperCase();
    if (upper.includes("FREE") && !upper.includes("FREEMIUM")) return "FREE";
    if (upper.includes("FREEMIUM")) return "FREEMIUM";
    return "PAID";
  }),
  estimatedTimeMinutes: z.number(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  relevanceScore: z.number(),
  description: z.string(),
});

// Simple schema for parsing AI response
const AIResponseSchema = z.object({
  recommendations: z.array(FlexibleResourceSchema),
});

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

  // Compound models have web search but don't support structured outputs
  // Using text generation with JSON parsing instead
  const aiModel = resourceModel;

  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  try {
    const { text } = await generateText({
      model,
      prompt,
      maxRetries: 3,
    });

    // Log raw response for debugging
    if (isDevelopment) {
      aiLogger.debug("Compound model raw response", {
        preview: text?.substring(0, 500),
      });
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from model");
    }

    // Extract JSON from response (may be wrapped in markdown code blocks)
    // Try multiple patterns
    let jsonStr = "";
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Try to find JSON object directly
      const jsonObjMatch = text.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
      if (jsonObjMatch) {
        jsonStr = jsonObjMatch[0];
      } else {
        jsonStr = text.trim();
      }
    }

    if (!jsonStr) {
      throw new Error(
        `Could not extract JSON from response: ${text.substring(0, 200)}`
      );
    }

    // Parse and validate
    const parsed = JSON.parse(jsonStr);
    const validated = AIResponseSchema.parse(parsed);

    return validated.recommendations;
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

  return `You are a learning path advisor with web search access.
USE WEB SEARCH to find current, working resource URLs.

**Skill:** ${input.skillName}
**Category:** ${input.skillCategory}
**Current Level:** ${input.currentLevel}/5
**Target Level:** ${input.targetLevel}/5
**Progress Required:** ${progressDescription}
${input.context ? `**Context:** ${input.context}` : ""}

**Your Task:**
Search the web and recommend 5 learning resources for ${input.skillName}.

**Requirements:**
1. USE WEB SEARCH to verify URLs exist
2. Prioritize free or low-cost options
3. Mix of formats (video, article, course, tutorial, practice)
4. Include estimated time commitment

**Response Format (JSON):**
\`\`\`json
{
  "recommendations": [
    {
      "title": "Resource Title",
      "provider": "Platform Name",
      "url": "https://verified-url.com",
      "type": "COURSE",
      "cost": "FREE",
      "estimatedTimeMinutes": 120,
      "difficulty": "INTERMEDIATE",
      "relevanceScore": 0.9,
      "description": "Brief description"
    }
  ]
}
\`\`\`

Return ONLY the JSON.`;
}
