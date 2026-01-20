import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET: Load a specific conversation
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const conversation = await db.chatConversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return new Response("Not found", { status: 404 });
  }

  return NextResponse.json(conversation);
}

// DELETE: Remove a conversation
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  await db.chatConversation.deleteMany({
    where: { id, userId: session.user.id },
  });

  return new Response(null, { status: 204 });
}
