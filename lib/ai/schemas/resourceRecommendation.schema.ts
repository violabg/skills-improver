import { z } from "zod";

export const ResourceRecommendationSchema = z.object({
  title: z.string().describe("Title of the learning resource"),
  provider: z
    .string()
    .describe("Platform or provider (e.g., Coursera, YouTube, FreeCodeCamp)"),
  url: z.string().url().describe("Direct link to the resource"),
  type: z
    .enum(["COURSE", "VIDEO", "ARTICLE", "BOOK", "TUTORIAL", "PRACTICE"])
    .describe("Type of learning resource"),
  cost: z.enum(["FREE", "FREEMIUM", "PAID"]).describe("Cost category"),
  estimatedTimeMinutes: z
    .number()
    .positive()
    .describe("Estimated time to complete in minutes"),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
    .describe("Difficulty level"),
  relevanceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("How relevant this resource is to the skill gap"),
  description: z
    .string()
    .describe("Brief description of what this resource covers"),
});

export type ResourceRecommendation = z.infer<
  typeof ResourceRecommendationSchema
>;

// Schema for AI response (just recommendations array, no wrapper)
export const AIResourceResponseSchema = z.object({
  recommendations: z
    .array(ResourceRecommendationSchema)
    .describe("Ranked list of recommended resources"),
});

// Full schema with skill context (for database storage)
export const ResourceListSchema = z.object({
  skillId: z.string().uuid(),
  skillName: z.string(),
  recommendations: z
    .array(ResourceRecommendationSchema)
    .describe("Ranked list of recommended resources"),
  learningPath: z
    .string()
    .describe("Suggested order and approach for using these resources"),
});

export type ResourceList = z.infer<typeof ResourceListSchema>;
