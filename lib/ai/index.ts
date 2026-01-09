/**
 * AI SDK 6 - Unified Exports
 *
 * Direct Functions for AI operations:
 *    - `assessSkill()` - Evaluate skill from Q&A
 *    - `generateSkills()` - Suggest skills for profile
 *    - `generateQuestions()` - Generate assessment questions
 *    - `recommendResources()` - Get learning resources
 *    - `analyzeGaps()` - Analyze skill gaps
 *
 * @example Direct Function Usage
 * ```typescript
 * import { assessSkill } from "@/lib/ai";
 * const result = await assessSkill({ skillId, skillName, ... });
 * ```
 */

// Direct functions
export { analyzeGaps } from "./analyzeGaps";
export { analyzeSkillGap, type SkillGapResult } from "./analyzeSkillGap";
export { assessSkill } from "./assessSkill";
export { generateAdvisorResponse } from "./chat-advisor";
export { generateQuestions } from "./generateQuestions";
export { generateSkills } from "./generateSkills";
export { recommendResources } from "./recommendResources";

// Models
export { gapAnalysisModel, skillEvaluationModel } from "./models";

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
