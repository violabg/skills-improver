import type { AuthenticatedContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure } from "../procedures";

const PDF_MAGIC_NUMBER = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const DOC_MAGIC_NUMBER = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]);
const DOCX_MAGIC_NUMBER = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

function validateFileContent(
  buffer: Uint8Array,
  claimedType: string
): { valid: boolean; error?: string } {
  const header = buffer.slice(0, 4);

  if (
    claimedType === "application/pdf" ||
    claimedType.endsWith(".pdf")
  ) {
    if (
      header[0] !== PDF_MAGIC_NUMBER[0] ||
      header[1] !== PDF_MAGIC_NUMBER[1] ||
      header[2] !== PDF_MAGIC_NUMBER[2] ||
      header[3] !== PDF_MAGIC_NUMBER[3]
    ) {
      return { valid: false, error: "File content does not match PDF format" };
    }
  }

  if (
    claimedType === "application/msword" ||
    claimedType.endsWith(".doc")
  ) {
    let matches = true;
    for (let i = 0; i < 4; i++) {
      if (header[i] !== DOC_MAGIC_NUMBER[i]) {
        matches = false;
        break;
      }
    }
    if (!matches) {
      return { valid: false, error: "File content does not match DOC format" };
    }
  }

  if (
    claimedType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    claimedType.endsWith(".docx")
  ) {
    let matches = true;
    for (let i = 0; i < 4; i++) {
      if (header[i] !== DOCX_MAGIC_NUMBER[i]) {
        matches = false;
        break;
      }
    }
    if (!matches) {
      return { valid: false, error: "File content does not match DOCX format" };
    }
  }

  return { valid: true };
}

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

      const { uploadResumeToR2, validateResumeFile } = await import(
        "@/lib/services/r2-storage"
      );

      const binaryString = atob(input.fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const contentValidation = validateFileContent(bytes, input.fileType);
      if (!contentValidation.valid) {
        throw new Error(contentValidation.error || "Invalid file content");
      }

      const blob = new Blob([bytes], { type: input.fileType });
      const file = new File([blob], input.fileName, { type: input.fileType });

      const fileValidation = validateResumeFile(file);
      if (!fileValidation.valid) {
        throw new Error(fileValidation.error || "Invalid file");
      }

      const cvUrl = await uploadResumeToR2(file, ctx.user.id);

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
