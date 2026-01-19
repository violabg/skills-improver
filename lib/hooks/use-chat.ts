"use client";

import { client } from "@/lib/orpc/client";
import { useState, useTransition } from "react";

export function useChat() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    message: string,
    roadmapId?: string,
  ): Promise<{
    response: string;
    suggestions?: string[];
  } | null> => {
    setError(null);

    try {
      const response = await new Promise<{
        response: string;
        suggestions?: string[];
      }>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await client.mentor.chat({ message, roadmapId });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      });

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      return null;
    }
  };

  return { sendMessage, isPending, error };
}
