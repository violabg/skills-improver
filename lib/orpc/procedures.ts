import { auth } from "@/lib/auth";
import { os } from "@orpc/server";
import type { BaseContext } from "./context";

// Base procedure with db in context
export const baseProcedure = os;

// Auth middleware that validates session and extends context with user
const authMiddleware = os.middleware(async ({ context, next }) => {
  const ctx = context as BaseContext;

  // Get session from better-auth using request headers
  const session = await auth.api.getSession({
    headers: ctx.headers,
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Fetch full user from database
  const user = await ctx.db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Extend context with user
  return next({
    context: {
      ...ctx,
      user,
    },
  });
});

// Public procedure (no auth required)
export const publicProcedure = baseProcedure;

// Protected procedure (auth required)
export const protectedProcedure = baseProcedure.use(authMiddleware);
