
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "component/prisma/schema.prisma",
  migrations: {
    path: "component/prisma/migrations",
  },
  datasource: {
    url: "file:C:/Users/HP/OneDrive/Desktop/Liberia dating site/prisma/dev.db",
  },
});
