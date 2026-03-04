import { oc } from "@orpc/contract";
import { z } from "zod";

const userSchema = z
  .object({
    id: z.uuid(),
    name: z.string().nullable().optional(),
    cvUrl: z.string().nullable().optional(),
    useCvForAnalysis: z.boolean().optional(),
  })
  .loose();

export const userContract = {
  me: oc.output(userSchema),

  getCvSettings: oc.output(
    z.object({
      cvUrl: z.string().nullable(),
      useCvForAnalysis: z.boolean(),
    }),
  ),

  uploadCv: oc
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileBase64: z.string(),
        fileSize: z.number(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        cvUrl: z.string(),
      }),
    ),

  deleteCv: oc.output(z.object({ success: z.boolean() })),

  update: oc
    .input(
      z.object({
        name: z.string().optional(),
        useCvForAnalysis: z.boolean().optional(),
      }),
    )
    .output(userSchema),
};
