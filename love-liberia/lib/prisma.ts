import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  try {
    const url = new URL(databaseUrl);
    if (!url.hostname.endsWith(".pooler.supabase.com")) return undefined;

    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    const connectionLimit =
      process.env.NODE_ENV === "production"
        ? url.searchParams.get("connection_limit") || "1"
        : process.env.PRISMA_CONNECTION_LIMIT || "5";
    url.searchParams.set("connection_limit", connectionLimit);
    return url.toString();
  } catch {
    return undefined;
  }
}

const datasourceUrl = getPrismaDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
