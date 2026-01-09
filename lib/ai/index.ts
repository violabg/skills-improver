/**
 * AI SDK 6 - Unified Exports
 *
 * This module provides two patterns for AI functionality:
 *
 * 1. **Direct Functions** (Current) - For standalone operations
 *    - `assessSkill()` - Evaluate skill from Q&A
 *    - `generateSkills()` - Suggest skills for profile
 *    - `generateQuestions()` - Generate assessment questions
 *    - `recommendResources()` - Get learning resources
 *    - `analyzeGaps()` - Analyze skill gaps
 *
 * 2. **Agent + Tools** (New) - For multi-step orchestration
 *    - `assessmentAgent` - ToolLoopAgent with all assessment tools
 *    - `evaluateSkillTool`, etc. - Individual tools for custom agents
 *
 * @example Direct Function Usage (existing pattern)
 * ```typescript
 * import { assessSkill } from "@/lib/ai";
 * const result = await assessSkill({ skillId, skillName, ... });
 * ```
 *
 * @example Agent Usage (new pattern)
 * ```typescript
 * import { assessmentAgent } from "@/lib/ai";
 * const result = await assessmentAgent.generate({
 *   prompt: "Analyze gaps and recommend resources...",
 * });
 * ```
 */

// Direct functions (existing)
export { analyzeGaps } from "./analyzeGaps";
export { assessSkill } from "./assessSkill";
export { generateAdvisorResponse } from "./chat-advisor";
export { generateQuestions } from "./generateQuestions";
export { generateSkills } from "./generateSkills";
export { recommendResources } from "./recommendResources";

// Models
export { gapAnalysisModel, skillEvaluationModel } from "./models";

// Agent (new)
export { assessmentAgent } from "./agents";
export type { AssessmentAgent } from "./agents";

// Tools (new)
export {
  analyzeGapsTool,
  evaluateSkillTool,
  generateQuestionsTool,
  generateSkillsTool,
  recommendResourcesTool,
} from "./tools";

// Schemas (for structured output)
export { SkillEvaluationSchema } from "./schemas/skillEvaluation.schema";
export type { SkillEvaluation } from "./schemas/skillEvaluation.schema";

export {
  GapAnalysisSchema,
  GapExplanationSchema,
} from "./schemas/gapExplanation.schema";
export type {
  GapAnalysis,
  GapExplanation,
} from "./schemas/gapExplanation.schema";

export {
  ResourceListSchema,
  ResourceRecommendationSchema,
} from "./schemas/resourceRecommendation.schema";
export type {
  ResourceList,
  ResourceRecommendation,
} from "./schemas/resourceRecommendation.schema";

export { QuestionSuggestionSchema } from "./schemas/questionSuggestion.schema";
export type { QuestionSuggestion } from "./schemas/questionSuggestion.schema";

export { SkillSuggestionSchema } from "./schemas/skillSuggestion.schema";
export type { SkillSuggestion } from "./schemas/skillSuggestion.schema";
