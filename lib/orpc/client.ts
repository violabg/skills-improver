import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { Router } from "./router";

declare global {
  // eslint-disable-next-line no-var
  var $client: RouterClient<Router> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/api/orpc`;
  },
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { headers } = await import("next/headers");
    return await headers();
  },
});

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const client: RouterClient<Router> =
  globalThis.$client ?? createORPCClient(link);
