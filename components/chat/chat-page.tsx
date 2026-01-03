"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/lib/hooks/use-chat";
import { useRef, useState } from "react";

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
  suggestions?: string[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "bot",
      text: "Hi! I'm your career advisor. I can help you understand your skill gaps, suggest learning resources, and guide your career transition. What would you like to know?",
      suggestions: [
        "What should I focus on first?",
        "How can I improve my JavaScript skills?",
        "Tell me about my assessment results",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const { sendMessage, isPending, error } = useChat();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: textToSend,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const response = await sendMessage(textToSend);

    if (response) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: response.message,
        suggestions: response.suggestions,
      };
      setMessages((m) => [...m, botMsg]);

      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    } else if (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: `Sorry, I encountered an error: ${error}. Please try again.`,
      };
      setMessages((m) => [...m, errorMsg]);
    }
  };

  return (
    <div className="mx-auto p-6 max-w-3xl">
      <div className="mb-4">
        <h1 className="font-semibold text-2xl">Career Advisor Chat</h1>
        <p className="text-muted-foreground text-sm">
          Get personalized guidance based on your assessment
        </p>
      </div>

      <div
        ref={scrollRef}
        className="space-y-4 bg-muted/30 p-4 border border-border rounded-lg h-[500px] overflow-auto"
      >
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            <div
              className={`flex gap-3 ${
                m.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.from === "bot" && (
                <div className="flex justify-center items-center bg-primary rounded-full w-8 h-8 font-medium text-primary-foreground text-xs shrink-0">
                  AI
                </div>
              )}
              <div
                className={`p-3 rounded-lg max-w-[75%] ${
                  m.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              {m.from === "user" && (
                <div className="flex justify-center items-center bg-muted border border-border rounded-full w-8 h-8 font-medium text-foreground text-xs shrink-0">
                  You
                </div>
              )}
            </div>

            {/* Suggestions */}
            {m.from === "bot" && m.suggestions && m.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-11">
                {m.suggestions.map((suggestion, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start gap-3">
            <div className="flex justify-center items-center bg-primary rounded-full w-8 h-8 font-medium text-primary-foreground text-xs">
              AI
            </div>
            <div className="bg-card p-3 border border-border rounded-lg">
              <div className="flex gap-1">
                <div className="bg-muted-foreground rounded-full w-2 h-2 animate-bounce" />
                <div className="bg-muted-foreground rounded-full w-2 h-2 animate-bounce [animation-delay:0.2s]" />
                <div className="bg-muted-foreground rounded-full w-2 h-2 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <Input
          placeholder="Ask me anything about your career development..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isPending}
        />
        <Button
          onClick={() => handleSendMessage()}
          disabled={isPending || !input.trim()}
        >
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
