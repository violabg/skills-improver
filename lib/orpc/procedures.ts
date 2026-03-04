import { auth } from "@/lib/auth";
import { contract } from "@/lib/contract/router";
import { implement } from "@orpc/server";
import type { BaseContext } from "./context";

// Create implementer from contract — replaces the old `os` from @orpc/server
export const os = implement(contract);

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

/**
 * Public implementer — no auth required, navigates the contract tree.
 * Usage: pub.health.ping.handler(...)
 */
export const pub = os;

/**
 * Authed implementer — auth required, navigates the contract tree.
 * Usage: authed.assessment.start.handler(...)
 */
export const authed = os.use(authMiddleware);
