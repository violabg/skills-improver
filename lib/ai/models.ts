import { groq } from "@ai-sdk/groq";

export const skillEvaluationModel = groq("llama-3.3-70b-versatile", {
  // Low temperature for consistent evaluation
  temperature: 0.3,
});

export const gapAnalysisModel = groq("llama-3.3-70b-versatile", {
  temperature: 0.5,
});
