import type { PrismaClient, User } from "../prisma/client";

export interface BaseContext {
  db: PrismaClient;
  headers: Headers;
}

export interface AuthenticatedContext extends BaseContext {
  user: User;
}
