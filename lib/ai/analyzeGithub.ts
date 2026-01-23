import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fastModel } from "./models";
import { isDevelopment } from "./utils";

// Schema for AI-inferred skill from GitHub analysis
export const GithubSkillInferenceSchema = z.object({
  skillId: z.string().optional(),
  skillName: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

export const GithubAnalysisResultSchema = z.object({
  inferredSkills: z.array(GithubSkillInferenceSchema),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  overallAssessment: z.string(),
  estimatedExperienceLevel: z.enum(["junior", "mid", "senior", "lead"]),
});

export type GithubSkillInference = z.infer<typeof GithubSkillInferenceSchema>;
export type GithubAnalysisResult = z.infer<typeof GithubAnalysisResultSchema>;

interface GithubProfileData {
  repoCount: number;
  totalStars: number;
  topLanguages: string[];
  topRepos: Array<{
    name: string;
    language: string | null;
    stars: number;
    description?: string | null;
  }>;
  commitActivity?: {
    totalCommits: number;
    avgPerWeek: number;
    consistencyScore: number; // 0-1
  };
  contributionPatterns?: {
    activeDays: number;
    longestStreak: number;
  };
}

interface AnalyzeGithubInput {
  profileData: GithubProfileData;
  targetRole?: string;
  availableSkills: Array<{ id: string; name: string; category: string }>;
}

export async function analyzeGithub(
  input: AnalyzeGithubInput,
): Promise<GithubAnalysisResult> {
  const prompt = buildGithubAnalysisPrompt(input);

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
      output: Output.object({ schema: GithubAnalysisResultSchema }),
      prompt,
      maxRetries: 3,
    });

    // Match skill names to IDs from available skills
    const matchedSkills = output.inferredSkills.map((skill) => {
      const matched = input.availableSkills.find(
        (s) => s.name.toLowerCase() === skill.skillName.toLowerCase(),
      );
      return {
        ...skill,
        skillId: matched?.id,
      };
    });

    return {
      ...output,
      inferredSkills: matchedSkills,
    };
  } catch (error) {
    console.error("GitHub analysis failed:", error);

    // Fallback response
    return {
      inferredSkills: [],
      strengths: ["Unable to analyze at this time"],
      recommendations: ["Please try again later"],
      overallAssessment: "Analysis failed due to technical error.",
      estimatedExperienceLevel: "mid",
    };
  }
}

function buildGithubAnalysisPrompt(input: AnalyzeGithubInput): string {
  const { profileData, targetRole, availableSkills } = input;

  const repoList = profileData.topRepos
    .map(
      (r) =>
        `- ${r.name} (${r.language || "unknown"}, ${r.stars} stars)${r.description ? `: ${r.description}` : ""}`,
    )
    .join("\n");

  const skillList = availableSkills.map((s) => s.name).join(", ");

  return `You are a senior technical recruiter analyzing a developer's GitHub profile.

**GitHub Profile Summary:**
- Total Repositories: ${profileData.repoCount}
- Total Stars: ${profileData.totalStars}
- Top Languages: ${profileData.topLanguages.join(", ")}
${
  profileData.commitActivity
    ? `
**Commit Activity:**
- Total Commits (recent): ${profileData.commitActivity.totalCommits}
- Average per Week: ${profileData.commitActivity.avgPerWeek.toFixed(1)}
- Consistency Score: ${(profileData.commitActivity.consistencyScore * 100).toFixed(0)}%
`
    : ""
}
**Top Repositories:**
${repoList}

${targetRole ? `**Target Role:** ${targetRole}` : ""}

**Available Skills to Match:**
${skillList}

**Your Task:**
Based on this GitHub profile, provide:
1. **inferredSkills**: Skills you can confidently infer from their repositories. Match to the available skills list when possible. Include confidence (0-1) and specific evidence.
2. **strengths**: Key strengths visible from their work (e.g., "Active open source contributor", "Strong TypeScript expertise")
3. **recommendations**: Suggestions for improvement relevant to their target role
4. **overallAssessment**: Brief 1-2 sentence summary of the developer
5. **estimatedExperienceLevel**: junior/mid/senior/lead based on the evidence

Be specific and evidence-based. Only infer skills with high confidence from clear signals.`;
}
