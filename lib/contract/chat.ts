import { oc } from "@orpc/contract";
import { z } from "zod";

export const chatContract = {
  sendMessage: oc.input(
    z.object({
      message: z.string().min(1, "Message cannot be empty"),
    }),
  ),
};
