import { groq } from "@ai-sdk/groq";

/**
 * AI Model Configuration
 *
 * All functions require structured outputs (Output.object).
 * Only GPT-OSS 20B/120B support strict mode.
 * Llama 4 Scout/Maverick and Kimi K2 support best-effort mode.
 *
 * @see https://console.groq.com/docs/structured-outputs#supported-models
 */

// GPT-OSS 20B - Fast, production, strict structured outputs
// Use for: high-frequency, simpler evaluations (assessSkill, questions, chat)
export const fastModel = groq("openai/gpt-oss-20b");

// GPT-OSS 120B - Best quality, production, strict structured outputs
// Use for: complex reasoning, gap analysis, resource recommendations
export const qualityModel = groq("openai/gpt-oss-120b");

// Llama 4 Scout - Preview, best-effort structured outputs, faster
// Use for: quick evaluations when rate limited on GPT-OSS
export const scoutModel = groq("meta-llama/llama-4-scout-17b-16e-instruct");
export const resourceModel = scoutModel;
// export const resourceModel = groq("groq/compound-mini");

// Legacy exports for backward compatibility
export const skillEvaluationModel = fastModel;
export const gapAnalysisModel = qualityModel;
