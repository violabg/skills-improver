import { oc } from "@orpc/contract";
import { z } from "zod";

export const resourcesContract = {
  list: oc.input(
    z
      .object({
        provider: z.string().optional(),
      })
      .optional(),
  ),

  get: oc.input(
    z.object({
      id: z.uuid(),
    }),
  ),

  create: oc.input(
    z.object({
      provider: z.string().min(1),
      url: z.string().url(),
      title: z.string().optional(),
      cost: z.string().optional(),
      estimatedTime: z.number().int().optional(),
    }),
  ),

  update: oc.input(
    z.object({
      id: z.uuid(),
      provider: z.string().optional(),
      url: z.string().url().optional(),
      title: z.string().optional(),
      cost: z.string().optional(),
      estimatedTime: z.number().int().optional(),
    }),
  ),

  delete: oc.input(
    z.object({
      id: z.uuid(),
    }),
  ),
};
