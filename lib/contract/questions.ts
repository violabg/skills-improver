import { oc } from "@orpc/contract";
import { z } from "zod";

const generatedQuestionSchema = z
  .object({
    id: z.uuid(),
    skillId: z.uuid(),
    type: z.enum(["code", "scenario", "explain"]),
    question: z.string(),
    context: z.string(),
    evaluationCriteria: z.string(),
    skillName: z.string(),
    category: z.enum(["hard", "soft"]),
  })
  .loose();

export const questionsContract = {
  generateForSkills: oc
    .input(
      z.object({
        assessmentId: z.uuid(),
        skillIds: z.array(z.uuid()),
      }),
    )
    .output(z.array(generatedQuestionSchema)),
};
