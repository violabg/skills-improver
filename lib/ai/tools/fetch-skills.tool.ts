import db from "@/lib/db";
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for fetching skills from the database.
 * Used by the agent to get available skills for selection or assessment.
 */
export const fetchSkillsTool = tool({
  description:
    "Fetch skills from the database. Can filter by category or domain. Returns skill details including name, category, domain, and difficulty.",

  inputSchema: z.object({
    category: z
      .enum(["HARD", "SOFT", "META"])
      .optional()
      .describe("Filter by skill category"),
    domain: z.string().optional().describe("Filter by skill domain"),
    limit: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of skills to return"),
  }),

  execute: async ({ category, domain, limit }) => {
    const skills = await db.skill.findMany({
      where: {
        ...(category && { category }),
        ...(domain && { domain }),
      },
      select: {
        id: true,
        name: true,
        category: true,
        domain: true,
        difficulty: true,
        assessable: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return {
      skills,
      count: skills.length,
      filters: { category, domain },
    };
  },

  toModelOutput: ({ output }) => ({
    type: "text" as const,
    value: `Fetched ${output.count} skills${
      output.filters.category ? ` (${output.filters.category})` : ""
    }.`,
  }),
});

export type FetchSkillsTool = typeof fetchSkillsTool;
