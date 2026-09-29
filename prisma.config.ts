import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Runtime traffic uses the pooled DATABASE_URL. Schema migrations need a
    // direct connection in production; local development may safely fall back.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
