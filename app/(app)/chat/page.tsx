import ChatWrapper from "@/components/chat/chat-wrapper";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { AiChat01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login?redirect=/chat");
  }

  const { id } = await searchParams;

  let initialChatId: string | undefined;
  let initialMessages: UIMessage[] = [];

  if (id) {
    // Load existing conversation
    const conversation = await db.chatConversation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (conversation) {
      initialChatId = conversation.id;
      initialMessages = (conversation.messages as unknown as UIMessage[]) || [];
    }
  }

  return (
    <div className="mx-auto p-6 max-w-7xl">
      <Card className="pb-0 overflow-hidden">
        <div className="flex flex-col mx-auto w-full h-[calc(100vh-10rem)]">
          <div className="space-y-2 pb-4 border-border/50 border-b text-center">
            <div className="inline-flex justify-center items-center bg-primary/10 mb-2 p-3 rounded-full">
              <HugeiconsIcon
                icon={AiChat01Icon}
                className="w-6 h-6 text-primary"
              />
            </div>
            <h1 className="font-bold text-3xl tracking-tight">
              AI Career Mentor
            </h1>
            <p className="text-muted-foreground text-lg">
              Personalized guidance for your career transition
            </p>
          </div>

          <div className="relative flex flex-1 bg-card shadow-primary/5 shadow-xl min-h-0 overflow-hidden">
            {/* Background blobs */}
            <div className="top-0 right-0 absolute bg-primary/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
            <div className="bottom-0 left-0 absolute bg-blue-500/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
            <ChatWrapper
              initialChatId={initialChatId}
              initialMessages={initialMessages}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
