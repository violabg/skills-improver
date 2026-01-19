import type { AuthenticatedContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure } from "../procedures";

export const userRouter = {
  // Get current user profile
  me: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;
    return ctx.user;
  }),

  // Get CV settings for the current user
  getCvSettings: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { cvUrl: true, useCvForAnalysis: true },
    });
    return {
      cvUrl: user?.cvUrl ?? null,
      useCvForAnalysis: user?.useCvForAnalysis ?? false,
    };
  }),

  // Upload CV file to R2 and save URL to user
  uploadCv: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileBase64: z.string(),
        fileSize: z.number(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;

      // Import R2 functions dynamically to avoid client-side issues
      const { uploadResumeToR2 } = await import("@/lib/services/r2-storage");

      // Convert base64 to File object
      const binaryString = atob(input.fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: input.fileType });
      const file = new File([blob], input.fileName, { type: input.fileType });

      // Upload to R2
      const cvUrl = await uploadResumeToR2(file, ctx.user.id);

      // Update user with new CV URL
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { cvUrl },
      });

      return { success: true, cvUrl };
    }),

  // Delete CV from R2 and clear user's cvUrl
  deleteCv: protectedProcedure.handler(async ({ context }) => {
    const ctx = context as AuthenticatedContext;

    // Get current CV URL
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { cvUrl: true },
    });

    if (user?.cvUrl) {
      // Import R2 functions dynamically
      const { deleteResumeFromR2 } = await import("@/lib/services/r2-storage");
      await deleteResumeFromR2(user.cvUrl);
    }

    // Clear CV URL from user
    await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { cvUrl: null },
    });

    return { success: true };
  }),

  // Update user profile (including CV preference)
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        useCvForAnalysis: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const user = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });

      return user;
    }),
};
