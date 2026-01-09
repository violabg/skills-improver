import { createRouterClient } from "@orpc/server";
import { headers } from "next/headers";
import "server-only";
import db from "../db";
import { router } from "./router";

export const serverClient = createRouterClient(router, {
  // Provide per-request context matching BaseContext
  context: async () => ({
    db,
    headers: await headers(),
  }),
});
