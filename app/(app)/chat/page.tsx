import ChatContent from "@/components/chat/chat-content";
import { Card } from "@/components/ui/card";
import { AiChat01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="mx-auto p-6 max-w-7xl">
      <Card className="pb-0">
        <div className="flex flex-col mx-auto h-[calc(100vh-10rem)]">
          <div className="space-y-2 mb-6 text-center">
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

          <div className="relative flex flex-col flex-1 bg-card shadow-primary/5 shadow-xl border border-border/50 rounded-3xl overflow-hidden">
            {/* Background blobs */}
            <div className="top-0 right-0 absolute bg-primary/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
            <div className="bottom-0 left-0 absolute bg-blue-500/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
            <Suspense
              fallback={<div className="p-8 text-center">Loading chat...</div>}
            >
              <ChatContent />
            </Suspense>
          </div>
        </div>
      </Card>
    </div>
  );
}
