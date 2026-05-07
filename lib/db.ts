import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let db: PrismaClient | null = null;

try {
  const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  db =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
      ...(connectionUrl && {
        datasources: {
          db: {
            url: connectionUrl,
          },
        },
      }),
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
} catch (error) {
  console.error("[v0] Prisma initialization error:", error);
  // Create a minimal client even if connection fails - it will error at runtime but won't break build
  db = new PrismaClient({
    log: ["error"],
  });
}

export { db };

