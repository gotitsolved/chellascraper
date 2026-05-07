import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let db: PrismaClient | null = null;

try {
  db =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ["error"],
      datasources: {
        db: {
          url: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        },
      },
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
} catch (error) {
  console.warn("[v0] Prisma initialization failed, using in-memory fallback:", error);
  db = null;
}

export { db };
