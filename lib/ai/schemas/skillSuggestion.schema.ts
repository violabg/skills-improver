import { z } from "zod";

export const SkillSuggestionSchema = z.object({
  // Names of existing skills that are relevant
  selectedSkillNames: z
    .array(z.string())
    .describe(
      "List of names of existing skills from the provided list that are most relevant to the user's profile and goal"
    ),

  // New skills to suggest creating
  newSkills: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Name of the skill, e.g. 'React Native' or 'Strategic Planning'"
          ),
        category: z
          .enum(["HARD", "SOFT", "META"])
          .describe("Category of the skill"),
        domain: z
          .string()
          .describe(
            "Domain of the skill, e.g. 'Mobile Development' or 'Leadership'"
          ),
        reasoning: z
          .string()
          .describe("Why this skill is relevant for this specific profile"),
      })
    )
    .describe(
      "List of new skills that should be added to the database to better match this profile"
    ),

  reasoning: z
    .string()
    .describe("Brief explanation of why these skills were selected"),
});

export type SkillSuggestion = z.infer<typeof SkillSuggestionSchema>;
