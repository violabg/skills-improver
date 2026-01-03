import ChatShell from "@/components/chat/chat-shell";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="p-6">
      <Suspense
        fallback={<div className="p-8 text-center">Loading chat...</div>}
      >
        <Card>
          <ChatShell />
        </Card>
      </Suspense>
    </div>
  );
}
