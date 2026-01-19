import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { qualityModel } from "./models";
import { isDevelopment } from "./utils";

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const MilestoneSchema = z.object({
  skillId: z.string().describe("UUID of the skill this milestone targets"),
  weekNumber: z.number().int().min(1).describe("Which week (1-indexed)"),
  title: z.string().describe("Short, action-oriented title"),
  description: z
    .string()
    .describe("Detailed learning objective for this milestone"),
  resources: z
    .array(
      z.object({
        type: z.enum(["ARTICLE", "VIDEO", "COURSE", "PROJECT", "BOOK"]),
        title: z.string(),
        url: z
          .string()
          .describe("URL to the resource, or empty string if not available"),
        estimatedHours: z
          .number()
          .describe("Estimated hours to complete, or 0 if unknown"),
      }),
    )
    .describe("2-4 recommended learning resources"),
});

const RoadmapSuggestionSchema = z.object({
  title: z
    .string()
    .describe('Motivational roadmap title, e.g., "Your 6-Week Path to Senior"'),
  totalWeeks: z
    .number()
    .int()
    .min(2)
    .max(12)
    .describe("Total duration calculated from gap severity"),
  milestones: z
    .array(MilestoneSchema)
    .describe("One milestone per skill gap, distributed across weeks"),
  reasoning: z
    .string()
    .describe("Brief explanation of why this schedule was chosen"),
});

export type RoadmapSuggestion = z.infer<typeof RoadmapSuggestionSchema>;
export type RoadmapMilestone = z.infer<typeof MilestoneSchema>;

// ============================================
// INPUT/OUTPUT TYPES
// ============================================

interface GapInfo {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priority: number;
}

interface GenerateRoadmapInput {
  targetRole: string;
  currentRole?: string;
  gaps: GapInfo[];
  yearsExperience?: string;
  careerIntent?: string;
  industry?: string;
}

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate adaptive roadmap duration based on gap severity.
 * - Base: 1 week per gap
 * - CRITICAL gaps: +0.5 weeks
 * - HIGH gaps: +0.25 weeks
 * - Minimum: 2 weeks, Maximum: 12 weeks
 */
function calculateTotalWeeks(gaps: GapInfo[]): number {
  let totalWeeks = 0;

  for (const gap of gaps) {
    // Base: 1 week per gap
    let weekContribution = 1;

    // Add extra time for severe gaps
    if (gap.impact === "CRITICAL") {
      weekContribution += 0.5;
    } else if (gap.impact === "HIGH") {
      weekContribution += 0.25;
    }

    // Scale by gap size
    weekContribution *= Math.max(1, gap.gapSize * 0.5);

    totalWeeks += weekContribution;
  }

  // Clamp to 2-12 weeks
  return Math.max(2, Math.min(12, Math.ceil(totalWeeks)));
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Generate an adaptive weekly roadmap from assessment gaps.
 * Uses AI to create personalized milestones with learning objectives and resources.
 */
export async function generateRoadmap(
  input: GenerateRoadmapInput,
): Promise<RoadmapSuggestion> {
  // Pre-calculate suggested duration to guide AI
  const suggestedWeeks = calculateTotalWeeks(input.gaps);

  const prompt = buildRoadmapPrompt(input, suggestedWeeks);

  const aiModel = qualityModel;
  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: RoadmapSuggestionSchema }),
      prompt,
    });

    // Ensure all milestones have valid skillIds from input
    const validSkillIds = new Set(input.gaps.map((g) => g.skillId));
    const validMilestones = output.milestones.filter((m) =>
      validSkillIds.has(m.skillId),
    );

    return {
      title: output.title,
      totalWeeks: output.totalWeeks,
      milestones: validMilestones,
      reasoning: output.reasoning,
    };
  } catch (error) {
    console.error("Roadmap generation failed:", error);

    // Fallback: create basic milestones from gaps
    return createFallbackRoadmap(input, suggestedWeeks);
  }
}

// ============================================
// PROMPT BUILDER
// ============================================

function buildRoadmapPrompt(
  input: GenerateRoadmapInput,
  suggestedWeeks: number,
): string {
  const gapsList = input.gaps
    .sort((a, b) => a.priority - b.priority) // Lower priority = higher importance
    .map(
      (g, i) =>
        `${i + 1}. **${g.skillName}** (ID: ${g.skillId})
   - Current: ${g.currentLevel}/5, Target: ${g.targetLevel}/5
   - Gap: ${g.gapSize}, Impact: ${g.impact}`,
    )
    .join("\n");

  const contextSection = [
    input.currentRole && `Current Role: ${input.currentRole}`,
    input.yearsExperience && `Experience: ${input.yearsExperience} years`,
    input.industry && `Industry: ${input.industry}`,
    input.careerIntent && `Career Intent: ${input.careerIntent}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a senior career coach creating a personalized learning roadmap.

**Target Role:** ${input.targetRole}
${contextSection ? `\n**Context:**\n${contextSection}\n` : ""}
**Skill Gaps to Address (sorted by priority):**
${gapsList}

**Your Task:**
Create a ${suggestedWeeks}-week learning roadmap with one milestone per skill gap.

**Requirements:**
1. Title: Create a motivating title like "Your ${suggestedWeeks}-Week Path to ${input.targetRole}"
2. Distribution: Spread milestones across weeks, prioritizing CRITICAL/HIGH gaps in earlier weeks
3. Each milestone must include:
   - The exact skillId from the list above
   - A clear, action-oriented title (e.g., "Master React Performance Patterns")
   - A detailed description of what the learner should achieve
   - 2-4 specific learning resources (articles, courses, videos, projects)
4. Reasoning: Explain why you structured the roadmap this way

**Guidelines:**
- CRITICAL gaps: Schedule in weeks 1-2
- HIGH gaps: Schedule in weeks 2-4
- MEDIUM/LOW gaps: Distribute across remaining weeks
- Consider skill dependencies (e.g., TypeScript before advanced React)
- Include at least one hands-on project per week
- Resources should be modern and relevant (2024-2026)

Be specific, practical, and encouraging.`;
}

// ============================================
// FALLBACK ROADMAP
// ============================================

function createFallbackRoadmap(
  input: GenerateRoadmapInput,
  totalWeeks: number,
): RoadmapSuggestion {
  const sortedGaps = [...input.gaps].sort((a, b) => a.priority - b.priority);

  const milestones: RoadmapMilestone[] = sortedGaps.map((gap, index) => {
    // Distribute milestones across weeks
    const weekNumber = Math.min(
      totalWeeks,
      Math.floor((index / sortedGaps.length) * totalWeeks) + 1,
    );

    return {
      skillId: gap.skillId,
      weekNumber,
      title: `Improve ${gap.skillName}`,
      description: `Focus on closing the gap in ${gap.skillName} from level ${gap.currentLevel} to ${gap.targetLevel}.`,
      resources: [
        {
          type: "ARTICLE" as const,
          title: `${gap.skillName} Best Practices`,
          url: "",
          estimatedHours: 2,
        },
        {
          type: "PROJECT" as const,
          title: `Practice ${gap.skillName}`,
          url: "",
          estimatedHours: 4,
        },
      ],
    };
  });

  return {
    title: `Your ${totalWeeks}-Week Path to ${input.targetRole}`,
    totalWeeks,
    milestones,
    reasoning:
      "This roadmap was generated with default scheduling. Prioritize CRITICAL and HIGH impact skills first.",
  };
}
