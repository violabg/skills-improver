import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "varlock/env";
import { PrismaClient } from "./prisma/client";

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (ENV.APP_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
