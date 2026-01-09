import { ToolLoopAgent, stepCountIs } from "ai";
import { skillEvaluationModel } from "../models";
import {
  analyzeGapsTool,
  evaluateSkillTool,
  generateQuestionsTool,
  generateSkillsTool,
  recommendResourcesTool,
} from "../tools";

/**
 * Unified Assessment Agent using AI SDK 6's ToolLoopAgent.
 *
 * This agent orchestrates all assessment-related AI operations:
 * - Skill evaluation from Q&A responses
 * - Gap analysis for career transitions
 * - Resource recommendations for skill development
 * - Question generation for skill validation
 * - Skill suggestions based on user profile
 *
 * The agent can be used in single-step mode (calling one tool)
 * or multi-step mode for complex workflows.
 *
 * @example
 * // Single skill evaluation
 * const result = await assessmentAgent.generate({
 *   prompt: `Evaluate the user's React skills based on their answer...`,
 * });
 *
 * @example
 * // Multi-step workflow
 * const result = await assessmentAgent.generate({
 *   prompt: `Analyze gaps for the user transitioning to Senior Frontend,
 *   then recommend resources for the top 3 gaps.`,
 * });
 */
export const assessmentAgent = new ToolLoopAgent({
  model: skillEvaluationModel,

  instructions: `You are a senior career assessment advisor with expertise in software engineering career paths.

Your role is to help professionals:
1. **Evaluate skills** - Assess proficiency levels from interview-style Q&A
2. **Identify gaps** - Analyze what's needed for career transitions
3. **Recommend resources** - Suggest learning paths to close skill gaps
4. **Generate questions** - Create tailored assessment questions
5. **Suggest skills** - Identify relevant skills for career goals

## Evaluation Guidelines
- Be objective and data-driven
- Use the 0-5 skill level scale consistently
- Provide constructive, actionable feedback
- Consider both technical depth and practical application
- Balance encouragement with honest assessment

## Response Style
- Concise and professional
- Evidence-based reasoning
- Focus on career growth potential
- Prioritize high-impact recommendations`,

  tools: {
    evaluateSkill: evaluateSkillTool,
    analyzeGaps: analyzeGapsTool,
    recommendResources: recommendResourcesTool,
    generateQuestions: generateQuestionsTool,
    generateSkills: generateSkillsTool,
  },

  // Limit iterations to prevent runaway loops
  stopWhen: stepCountIs(10),
});

// Type exports for UI integration
export type AssessmentAgent = typeof assessmentAgent;
