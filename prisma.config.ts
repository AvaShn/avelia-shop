import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

const localGenerationUrl =
  "postgresql://postgres:postgres@localhost:5432/avelia?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? localGenerationUrl,
  },
});
