"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { AiChat01Icon, SentIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p({ children }) {
          return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
        },
        h1({ children }) {
          return <h1 className="mt-6 mb-4 font-bold text-xl">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="mt-5 mb-3 font-bold text-lg">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mt-4 mb-2 font-bold text-base">{children}</h3>;
        },
        ul({ children }) {
          return <ul className="mb-4 pl-6 list-disc">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-4 pl-6 list-decimal">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-1 last:mb-0">{children}</li>;
        },
        code({
          inline,
          className,
          children,
          ...props
        }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <Highlight
              theme={themes.vsDark}
              code={String(children).replace(/\n$/, "")}
              language={match[1]}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div className="relative my-4 rounded-md overflow-hidden">
                  <div className="flex justify-between items-center bg-zinc-700 px-4 py-1 text-zinc-300 text-xs">
                    <span>{match[1]}</span>
                  </div>
                  <pre
                    className={`${className} p-4 overflow-x-auto text-sm`}
                    style={style}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </Highlight>
          ) : (
            <code
              className={`${className} bg-muted px-1 py-0.5 rounded font-mono text-sm`}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

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
                  {m.parts
                    .filter((part) => part.type === "text")
                    .map((part, partIndex) => (
                      <div
                        key={partIndex}
                        className="dark:prose-invert max-w-none wrap-break-word prose prose-sm"
                      >
                        <MarkdownRenderer content={part.text} />
                      </div>
                    ))}
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
