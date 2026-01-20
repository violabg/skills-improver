"use client";

import { Button } from "@/components/ui/button";
import {
  Add01Icon,
  AiChat01Icon,
  MessageMultiple01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export default function ConversationSidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        console.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };
    loadConversations();
  }, [currentChatId]); // Reload when chat changes

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col bg-muted/30 border-border/50 border-r w-64 shrink-0">
      <div className="p-4 border-border/50 border-b">
        <Button
          onClick={onNewChat}
          className="justify-start gap-2 w-full"
          variant="outline"
        >
          <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-muted-foreground text-sm text-center">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm text-center">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectChat(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                  currentChatId === conv.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={
                      currentChatId === conv.id
                        ? AiChat01Icon
                        : MessageMultiple01Icon
                    }
                    className="w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {conv.title || "New conversation"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
