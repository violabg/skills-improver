import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { RouterClient } from "@orpc/server";
import type { Router } from "../orpc/router";

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
 * Typed oRPC client for direct calls (e.g., in server actions or non-query contexts)
 */
export const client: RouterClient<Router> = createORPCClient(link);

/**
 * TanStack Query utils created from the oRPC client.
 * Use this at call sites for queryOptions / mutationOptions / key management.
 *
 * @example
 * ```ts
 * import { useQuery } from "@tanstack/react-query";
 * import { appQuery } from "@/lib/service/client";
 *
 * const { data } = useQuery(appQuery.skills.list.queryOptions({
 *   input: { category: "HARD" },
 * }));
 * ```
 */
export const appQuery = createORPCReactQueryUtils(client);
