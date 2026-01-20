"use client";

import ChatContent from "@/components/chat/chat-content";
import ConversationSidebar from "@/components/chat/conversation-sidebar";
import type { UIMessage } from "ai";
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

  const handleNewChat = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/chat/conversations", { method: "POST" });
      if (res.ok) {
        const { id } = await res.json();
        setCurrentChatId(id);
        setMessages([]);
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
    // Update URL without reload
    window.history.pushState({}, "", `/chat?id=${id}`);

    // Load messages for selected chat
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
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
    <div className="flex w-full h-full">
      <ConversationSidebar
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <ChatContent
          key={currentChatId}
          chatId={currentChatId}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
