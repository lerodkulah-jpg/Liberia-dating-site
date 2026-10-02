import "dotenv/config";
import { env } from "node:process";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "component/prisma/schema.prisma",
  migrations: {
    path: "component/prisma/migrations",
  },
  datasource: {
    // Use environment variable for deployment, fallback to local file for development
    url: env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/love_liberia",
  },
});
