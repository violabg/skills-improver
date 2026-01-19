import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../procedures";

export const resourcesRouter = {
  // List resources (public, optional provider filter)
  list: publicProcedure
    .input(
      z
        .object({
          provider: z.string().optional(),
        })
        .optional(),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as BaseContext;
      const resources = await ctx.db.resource.findMany({
        where: {
          ...(input?.provider && { provider: input.provider }),
        },
        orderBy: { createdAt: "desc" },
      });

      return resources;
    }),

  // Get single resource by id (public)
  get: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as BaseContext;
      const resource = await ctx.db.resource.findUnique({
        where: { id: input.id },
      });

      if (!resource) throw new Error("Resource not found");
      return resource;
    }),

  // Create resource (protected)
  create: protectedProcedure
    .input(
      z.object({
        provider: z.string().min(1),
        url: z.string().url(),
        title: z.string().optional(),
        cost: z.string().optional(),
        estimatedTime: z.number().int().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const resource = await ctx.db.resource.create({ data: input });
      return resource;
    }),

  // Update resource (protected)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        provider: z.string().optional(),
        url: z.string().url().optional(),
        title: z.string().optional(),
        cost: z.string().optional(),
        estimatedTime: z.number().int().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      const { id, ...rest } = input;
      // Note: Resources are currently global (not user-scoped)
      // TODO: Add createdBy field to Resource model if user-scoping is needed
      const resource = await ctx.db.resource.update({
        where: { id },
        data: rest as Partial<typeof input>,
      });
      return resource;
    }),

  // Delete resource (protected)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const ctx = context as AuthenticatedContext;
      // Note: Resources are currently global (not user-scoped)
      // TODO: Add createdBy field to Resource model if user-scoping is needed
      await ctx.db.resource.delete({ where: { id: input.id } });
      return { ok: true };
    }),
};
