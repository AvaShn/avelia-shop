import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnvironment } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database verification.");
}

const expectedTables = [
  "User",
  "Category",
  "Product",
  "Order",
  "OrderItem",
  "Payment",
] as const;

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5_000,
});
const prisma = new PrismaClient({ adapter });

async function verifyDatabase() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const availableTables = new Set(tables.map((table) => table.table_name));
  const missingTables = expectedTables.filter(
    (table) => !availableTables.has(table),
  );

  if (missingTables.length > 0) {
    throw new Error(`Missing database tables: ${missingTables.join(", ")}`);
  }

  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);

  console.info(
    `Database connection verified: ${categoryCount} categories and ${productCount} products.`,
  );
}

verifyDatabase()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
