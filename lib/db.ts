// Database connection singleton - Last updated: 2026-05-07
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

let db: PrismaClient | null = null;

try {
  const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (connectionUrl) {
    db =
      globalForPrisma.prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
        datasources: {
          db: {
            url: connectionUrl,
          },
        },
      });

    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
  } else {
    console.warn("[v0] DATABASE_URL not set, database will be unavailable at runtime");
  }
} catch (error) {
  console.error("[v0] Prisma initialization error:", error);
  // Don't rethrow - just log the error so build can continue
}

export { db };


