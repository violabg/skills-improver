import type { AuthenticatedContext, BaseContext } from "@/lib/orpc/context";
import { authed, pub } from "../procedures";

export const resourcesRouter = {
  list: pub.resources.list.handler(async ({ input, context }) => {
    const ctx = context as BaseContext;
    const resources = await ctx.db.resource.findMany({
      where: {
        ...(input?.provider && { provider: input.provider }),
      },
      orderBy: { createdAt: "desc" },
    });

    return resources;
  }),

  get: pub.resources.get.handler(async ({ input, context }) => {
    const ctx = context as BaseContext;
    const resource = await ctx.db.resource.findUnique({
      where: { id: input.id },
    });

    if (!resource) throw new Error("Resource not found");
    return resource;
  }),

  create: authed.resources.create.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    const resource = await ctx.db.resource.create({ data: input });
    return resource;
  }),

  update: authed.resources.update.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    const { id, ...rest } = input;
    const resource = await ctx.db.resource.update({
      where: { id },
      data: rest as Partial<typeof input>,
    });
    return resource;
  }),

  delete: authed.resources.delete.handler(async ({ input, context }) => {
    const ctx = context as AuthenticatedContext;
    await ctx.db.resource.delete({ where: { id: input.id } });
    return { ok: true };
  }),
};
