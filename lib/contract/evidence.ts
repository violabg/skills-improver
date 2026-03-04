import { oc } from "@orpc/contract";
import { z } from "zod";

export const evidenceContract = {
  create: oc.input(
    z.object({
      provider: z.string().optional(),
      referenceUrl: z.string().url().optional(),
      retentionDays: z.number().int().min(0).max(365).optional(),
      allowRawStorage: z.boolean().optional(),
    }),
  ),

  list: oc,

  get: oc.input(z.object({ id: z.uuid() })),

  delete: oc.input(z.object({ id: z.uuid() })),

  connectGithub: oc.input(
    z.object({
      retentionDays: z.number().int().min(0).max(365).optional(),
      allowRawStorage: z.boolean().optional(),
      targetRole: z.string().optional(),
    }),
  ),
};
