import { auth } from "@/lib/auth";
import { ORPCError, createMiddleware, createProcedure } from "@orpc/server";
import type { AuthenticatedContext, BaseContext } from "./context";

// Base procedure with db in context
export const baseProcedure = createProcedure<BaseContext>();

// Auth middleware that validates session and extends context with user
const withAuth = createMiddleware<BaseContext, AuthenticatedContext>(
  async ({ ctx, next }) => {
    // Get session from better-auth using request headers
    const session = await auth.api.getSession({
      headers: ctx.headers,
    });

    if (!session?.user) {
      throw new ORPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Fetch full user from database
    const user = await ctx.db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new ORPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    // Extend context with user
    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }
);

// Public procedure (no auth required)
export const publicProcedure = baseProcedure;

// Protected procedure (auth required)
export const protectedProcedure = baseProcedure.use(withAuth);
