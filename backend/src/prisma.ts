import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isSqliteUrl(url?: string) {
  return !!url && url.startsWith("file:");
}

async function initSqlitePragmas(client: PrismaClient) {
  const dbUrl = process.env.DATABASE_URL;

  // Alleen uitvoeren bij SQLite
  if (!isSqliteUrl(dbUrl)) {
    return;
  }

  const pragmas = [
    "PRAGMA journal_mode = WAL;",
    "PRAGMA foreign_keys = ON;",
    "PRAGMA busy_timeout = 10000;",
    "PRAGMA synchronous = NORMAL;",
  ];

  for (const pragma of pragmas) {
    try {
      await client.$queryRawUnsafe(pragma);
    } catch (error) {
      console.error(`[Prisma] Failed to execute ${pragma}`, error);
    }
  }

  console.log("[Prisma] SQLite pragmas initialized");
}

/** Wordt awaited bij startup */
export const prismaReady = initSqlitePragmas(prisma);

export { prisma };

