"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { AiChat01Icon, SentIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

interface ChatContentProps {
  chatId: string;
  initialMessages?: UIMessage[];
}

export default function ChatContent({
  chatId,
  initialMessages = [],
}: ChatContentProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");

  // Memoize transport to avoid recreating on each render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport,
  });

  // Sync initial messages when they change
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const isLoading = status === "submitted" || status === "streaming";

  // Extract text content from message parts
  const getMessageText = (
    parts: Array<{ type: string; text?: string }>,
  ): string => {
    return parts
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join("");
  };

  return (
    <>
      <div
        ref={scrollRef}
        className="z-10 relative flex-1 space-y-6 p-6 scrollbar-thumb-border overflow-y-auto scrollbar-thin scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="flex flex-col justify-center items-center py-12 text-center">
            <div className="bg-muted mb-4 p-4 rounded-full">
              <HugeiconsIcon
                icon={AiChat01Icon}
                className="w-8 h-8 text-muted-foreground"
              />
            </div>
            <p className="mb-6 text-muted-foreground">
              Hi! I&apos;m your career advisor. Ask about your roadmap,
              assessment results, or career tips.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What should I focus on first?",
                "How can I improve my JavaScript skills?",
                "Tell me about my assessment results",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50 rounded-full h-8 text-foreground/80 hover:text-primary text-xs transition-all"
                  onClick={() => {
                    sendMessage({ text: suggestion });
                  }}
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className="slide-in-from-bottom-2 space-y-3 animate-in duration-300 fade-in"
          >
            <div
              className={`flex gap-4 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm ${
                  m.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <HugeiconsIcon
                  icon={m.role === "assistant" ? AiChat01Icon : UserIcon}
                  className="w-5 h-5"
                />
              </div>

              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-5 py-3.5 rounded-2xl shadow-sm text-base leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {getMessageText(m.parts)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="flex gap-4">
            <div className="flex justify-center items-center bg-primary shadow-sm rounded-full w-10 h-10 text-primary-foreground shrink-0">
              <HugeiconsIcon icon={AiChat01Icon} className="w-5 h-5" />
            </div>
            <div className="bg-muted/50 px-5 py-4 border border-border/50 rounded-2xl rounded-tl-none">
              <div className="flex gap-1.5">
                <div className="bg-foreground/30 rounded-full w-2 h-2 animate-bounce" />
                <div className="bg-foreground/30 rounded-full w-2 h-2 animate-bounce [animation-delay:0.2s]" />
                <div className="bg-foreground/30 rounded-full w-2 h-2 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="z-20 bg-background/80 backdrop-blur-md p-4 border-border/50 border-t">
        <div className="relative flex gap-3 mx-auto max-w-3xl">
          <Input
            placeholder="Ask for advice, resources, or career tips..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-background shadow-sm pl-5 border-border/60 focus:border-primary rounded-full focus:ring-2 focus:ring-primary/20 h-12 text-base transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shadow-md shadow-primary/20 rounded-full w-12 h-12 shrink-0"
          >
            <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
