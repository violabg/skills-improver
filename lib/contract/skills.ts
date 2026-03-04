import { oc } from "@orpc/contract";
import { z } from "zod";

const skillSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    category: z.enum(["HARD", "SOFT", "META"]),
    domain: z.string().nullable().optional(),
  })
  .loose();

export const skillsContract = {
  list: oc
    .input(
      z
        .object({
          category: z.enum(["HARD", "SOFT", "META"]).optional(),
          domain: z.string().optional(),
        })
        .optional(),
    )
    .output(z.array(skillSchema)),

  generateForProfile: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
      }),
    )
    .output(
      z.object({
        skills: z.array(skillSchema),
        reasoning: z.string(),
      }),
    ),

  get: oc
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .output(skillSchema),

  getGraph: oc.output(z.array(skillSchema)),
};
