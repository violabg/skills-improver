"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState, useTransition } from "react";

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: input,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    startTransition(async () => {
      // Simulate bot reply
      await new Promise((r) => setTimeout(r, 700));
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: `Echo: ${userMsg.text}`,
      };
      setMessages((m) => [...m, botMsg]);
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  return (
    <div className="mx-auto p-6 max-w-3xl">
      <h1 className="mb-4 font-semibold text-2xl">Chat</h1>

      <div
        ref={scrollRef}
        className="space-y-4 p-4 border rounded-lg h-96 overflow-auto"
      >
        {messages.length === 0 && (
          <p className="text-muted-foreground">No messages yet — say hi!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${
              m.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.from === "bot" && (
              <div className="flex justify-center items-center bg-card rounded-full w-8 h-8 text-xs">
                AI
              </div>
            )}
            <div
              className={`p-3 rounded-lg max-w-[70%] ${
                m.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground"
              }`}
            >
              {m.text}
            </div>
            {m.from === "user" && (
              <div className="flex justify-center items-center bg-primary rounded-full w-8 h-8 text-xs">
                You
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={isPending || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
