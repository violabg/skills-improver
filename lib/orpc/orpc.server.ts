import "server-only";

import { createRouterClient } from "@orpc/server";
import { headers } from "next/headers";
import { router } from "./router";

declare global {
  // eslint-disable-next-line no-var
  var $serverClient: ReturnType<typeof createRouterClient> | undefined;
}

if (!globalThis.$serverClient) {
  globalThis.$serverClient = createRouterClient(router, {
    context: async () => ({
      headers: await headers(),
    }),
  });
}

export const serverClient = globalThis.$serverClient;
