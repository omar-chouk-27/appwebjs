import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const g = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const cleanPath = dbUrl.startsWith("file:") ? dbUrl.slice("file:".length) : dbUrl;
  const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), cleanPath);

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = g.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  g.prisma = prisma;
}