import { oc } from "@orpc/contract";
import { z } from "zod";

export const mentorContract = {
  chat: oc.input(
    z.object({
      message: z.string().min(1),
      roadmapId: z.uuid().optional(),
    }),
  ),

  getHistory: oc.input(
    z.object({
      limit: z.number().int().min(1).max(50).default(20),
    }),
  ),
};
