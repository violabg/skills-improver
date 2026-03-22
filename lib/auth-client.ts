"use client";

import { createAuthClient } from "better-auth/react";
import { ENV } from "varlock/env";

export const authClient = createAuthClient({
  baseURL: ENV.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, useSession } = authClient;
