import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { serverEnvironment } from "@/lib/env/server";

type PrismaGlobal = typeof globalThis & {
  aveliaPrisma?: PrismaClient | undefined;
};

const prismaGlobal = globalThis as PrismaGlobal;
let modulePrisma: PrismaClient | undefined;

function createPrismaClient(databaseUrl: string) {
  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({
    adapter,
    log:
      serverEnvironment.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export function getPrismaClient() {
  const databaseUrl = serverEnvironment.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  const client =
    prismaGlobal.aveliaPrisma ??
    modulePrisma ??
    createPrismaClient(databaseUrl);

  modulePrisma = client;

  if (serverEnvironment.NODE_ENV !== "production") {
    prismaGlobal.aveliaPrisma = client;
  }

  return client;
}

export function isDatabaseConfigured() {
  return Boolean(serverEnvironment.DATABASE_URL);
}
