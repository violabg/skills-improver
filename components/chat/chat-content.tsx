"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { Bot, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ChatContentProps {
  chatId: string;
  initialMessages?: UIMessage[];
}

export default function ChatContent({
  chatId,
  initialMessages = [],
}: ChatContentProps) {
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
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  const suggestions = [
    "What should I focus on first?",
    "How can I improve my JavaScript skills?",
    "Tell me about my assessment results",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Conversation className="flex-1">
        <ConversationContent className="gap-6 p-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Hi! I'm your career advisor"
              description="Ask about your roadmap, assessment results, or career tips."
              icon={
                <div className="bg-muted p-4 rounded-full">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
              }
            >
              <div className="flex flex-col justify-center items-center gap-4 pt-4 text-center">
                <div className="bg-muted p-4 rounded-full">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    Hi! I&apos;m your career advisor
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Ask about your roadmap, assessment results, or career tips.
                  </p>
                </div>
                <Suggestions className="mt-4">
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      suggestion={suggestion}
                      onClick={handleSuggestionClick}
                      disabled={isLoading}
                      className="bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50 text-foreground/80 hover:text-primary text-xs transition-all"
                    />
                  ))}
                </Suggestions>
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((m, index) => (
                <Message key={m.id || index} from={m.role}>
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
                      {m.role === "assistant" ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>

                    <MessageContent
                      className={`max-w-[80%] ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-5 py-3.5 shadow-sm"
                          : "bg-muted/50 border border-border/50 rounded-2xl rounded-tl-none px-5 py-3.5 shadow-sm"
                      }`}
                    >
                      {m.parts
                        .filter((part) => part.type === "text")
                        .map((part, partIndex) => (
                          <MessageResponse key={partIndex}>
                            {part.text}
                          </MessageResponse>
                        ))}
                    </MessageContent>
                  </div>
                </Message>
              ))}

              {status === "submitted" && (
                <Message from="assistant">
                  <div className="flex gap-4">
                    <div className="flex justify-center items-center bg-primary shadow-sm rounded-full w-10 h-10 text-primary-foreground shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 px-5 py-4 border border-border/50 rounded-2xl rounded-tl-none">
                      <Loader size={16} />
                      <span className="text-muted-foreground text-sm">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="z-20 bg-background/80 backdrop-blur-md p-4 border-border/50 border-t">
        <PromptInput
          onSubmit={handleSubmit}
          className="bg-background shadow-sm mx-auto border border-border/60 focus-within:border-primary rounded-xl focus-within:ring-2 focus-within:ring-primary/20 max-w-3xl transition-all"
        >
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for advice, resources, or career tips..."
            disabled={isLoading}
            className="bg-transparent px-4 py-3 border-0 focus:ring-0 min-h-12 text-base"
          />
          <PromptInputFooter className="p-2 pt-0">
            <div />
            <PromptInputSubmit
              status={status}
              disabled={isLoading || !input.trim()}
              className="shadow-md shadow-primary/20 rounded-full"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
