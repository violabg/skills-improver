/**
 * AI SDK 6 Tools for the Assessment Agent
 *
 * These tools are designed to be used with ToolLoopAgent for
 * orchestrating multi-step assessment workflows.
 */

export { evaluateSkillTool } from "./evaluate-skill.tool";
export type { EvaluateSkillTool } from "./evaluate-skill.tool";

export { recommendResourcesTool } from "./recommend-resources.tool";
export type { RecommendResourcesTool } from "./recommend-resources.tool";

export { analyzeGapsTool } from "./analyze-gaps.tool";
export type { AnalyzeGapsTool } from "./analyze-gaps.tool";

export { generateQuestionsTool } from "./generate-questions.tool";
export type { GenerateQuestionsTool } from "./generate-questions.tool";

export { generateSkillsTool } from "./generate-skills.tool";
export type { GenerateSkillsTool } from "./generate-skills.tool";

export { fetchSkillsTool } from "./fetch-skills.tool";
export type { FetchSkillsTool } from "./fetch-skills.tool";

export { fetchAssessmentTool } from "./fetch-assessment.tool";
export type { FetchAssessmentTool } from "./fetch-assessment.tool";
