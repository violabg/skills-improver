import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";

// GET: List user's conversations
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const conversations = await db.chatConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(conversations);
}

// POST: Create new conversation
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const conversation = await db.chatConversation.create({
    data: {
      userId: session.user.id,
      title: null, // Will be set after first message
      messages: [],
    },
  });

  return Response.json({ id: conversation.id });
}
