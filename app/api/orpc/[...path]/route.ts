import { db } from "@/lib/db";
import { router } from "@/lib/orpc/router";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error("oRPC Error:", error);
    }),
  ],
});

async function handleRequest(request: Request) {
  const headers = new Headers(request.headers);

  const { response } = await handler.handle(request, {
    prefix: "/api/orpc",
    context: {
      db,
      headers,
    },
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
