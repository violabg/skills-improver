"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/lib/hooks/use-chat";
import { client } from "@/lib/orpc/client";
import { AiChat01Icon, SentIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await client.mentor.getHistory({ limit: 20 });
        if (history && history.length > 0) {
          const formattedHistory: Message[] = history.flatMap((h) => [
            {
              id: `u-${h.id}`,
              from: "user" as const,
              text: h.userMessage || "",
            },
            { id: `b-${h.id}`, from: "bot" as const, text: h.mentorMessage },
          ]);
          setMessages(formattedHistory);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    loadHistory();
  }, []);

  const messageIdCounter = useRef(0);
  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input;
      if (!textToSend.trim()) return;

      const userMsg: Message = {
        id: `u-${messageIdCounter.current++}`,
        from: "user",
        text: textToSend,
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");

      const response = await sendMessage(textToSend);

      if (response) {
        const botMsg: Message = {
          id: `b-${messageIdCounter.current++}`,
          from: "bot",
          text: response.response,
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
          id: `e-${messageIdCounter.current++}`,
          from: "bot",
          text: `Sorry, I encountered an error: ${error}. Please try again.`,
        };
        setMessages((m) => [...m, errorMsg]);
      }
    },
    [input, sendMessage, error],
  );

  return (
    <div className="flex flex-col mx-auto h-[calc(100vh-10rem)]">
      <div className="space-y-2 mb-6 text-center">
        <div className="inline-flex justify-center items-center bg-primary/10 mb-2 p-3 rounded-full">
          <HugeiconsIcon icon={AiChat01Icon} className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-bold text-3xl tracking-tight">AI Career Mentor</h1>
        <p className="text-muted-foreground text-lg">
          Personalized guidance for your career transition
        </p>
      </div>

      <div className="relative flex flex-col flex-1 bg-card shadow-primary/5 shadow-xl border border-border/50 rounded-3xl overflow-hidden">
        {/* Background blobs */}
        <div className="top-0 right-0 absolute bg-primary/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
        <div className="bottom-0 left-0 absolute bg-blue-500/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />

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
              <p className="text-muted-foreground">
                How can I help you today? Ask about your roadmap or assessment
                results.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className="slide-in-from-bottom-2 space-y-3 animate-in duration-300 fade-in"
            >
              <div
                className={`flex gap-4 ${
                  m.from === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm ${
                    m.from === "bot"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <HugeiconsIcon
                    icon={m.from === "bot" ? AiChat01Icon : UserIcon}
                    className="w-5 h-5"
                  />
                </div>

                <div
                  className={`flex flex-col gap-1 max-w-[80%] ${
                    m.from === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-5 py-3.5 rounded-2xl shadow-sm text-base leading-relaxed ${
                      m.from === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {m.from === "bot" &&
                m.suggestions &&
                m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-14">
                    {m.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50 rounded-full h-8 text-foreground/80 hover:text-primary text-xs transition-all"
                        onClick={() => handleSendMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {isPending && (
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
              disabled={isPending}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isPending || !input.trim()}
              size="icon"
              className="shadow-md shadow-primary/20 rounded-full w-12 h-12 shrink-0"
            >
              <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
