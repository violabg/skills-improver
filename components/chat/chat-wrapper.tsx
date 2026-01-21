"use client";

import ChatContent from "@/components/chat/chat-content";
import ConversationSidebar from "@/components/chat/conversation-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { UIMessage } from "ai";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ChatWrapperProps {
  initialChatId?: string;
  initialMessages?: UIMessage[];
}

export default function ChatWrapper({
  initialChatId,
  initialMessages = [],
}: ChatWrapperProps) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    initialChatId ?? null,
  );
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [isCreating, setIsCreating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getLastMessageText = (msgs: UIMessage[]) => {
    if (msgs.length === 0) return "New conversation";
    const lastMsg = msgs[msgs.length - 1];
    return (
      lastMsg.parts.find((p) => p.type === "text")?.text || "New conversation"
    );
  };

  const handleNewChat = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/chat/conversations", { method: "POST" });
      if (res.ok) {
        const { id } = await res.json();
        setCurrentChatId(id);
        setMessages([]);
        setIsSidebarOpen(false);
        // Update URL without reload
        window.history.pushState({}, "", `/chat?id=${id}`);
      }
    } catch {
      console.error("Failed to create chat");
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Create a new chat if none exists
  useEffect(() => {
    if (!currentChatId && !isCreating) {
      handleNewChat();
    }
  }, [currentChatId, isCreating, handleNewChat]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync URL with currentChatId if it changes and isn't reflected in URL
  useEffect(() => {
    if (currentChatId) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") !== currentChatId) {
        url.searchParams.set("id", currentChatId);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [currentChatId]);

  const handleSelectChat = useCallback(async (id: string) => {
    setCurrentChatId(id);
    setMessages([]); // Clear messages immediately
    setIsSidebarOpen(false);
    // Update URL without reload
    window.history.pushState({}, "", `/chat?id=${id}`);

    // Load messages for selected chat
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const validMessages = (data.messages || []).map((m: UIMessage) => ({
          ...m,
          id: m.id || crypto.randomUUID(),
        }));
        setMessages(validMessages);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  if (!currentChatId) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Creating new conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Desktop Sidebar */}
      <ConversationSidebar
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        className="hidden lg:flex w-64"
      />

      {/* Mobile Sheet */}
      <div className="">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="lg:hidden p-0 w-80">
            <ConversationSidebar
              currentChatId={currentChatId}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              className="flex border-r-0 w-full h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-2 p-2 border-border/50 border-b">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="flex-1 font-medium text-sm truncate">
            {getLastMessageText(messages)}
          </div>
        </div>
        <ChatContent
          key={currentChatId}
          chatId={currentChatId}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
