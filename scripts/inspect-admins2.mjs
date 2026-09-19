import bcrypt from "bcryptjs";

// Inspect via raw SQL to bypass Prisma field validation.
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(
  "SELECT email, role, isActive, password, failedLoginCount, lockedUntil FROM User WHERE role IN ('ADMIN','SUPER_ADMIN','MODERATOR')",
);

for (const row of rows) {
  console.log(
    `\n${row.email}  role=${row.role}  active=${row.isActive}  failed=${row.failedLoginCount}  locked=${row.lockedUntil}`,
  );
  console.log(
    `  hash: ${String(row.password).slice(0, 7)}... len=${String(row.password).length}`,
  );
  for (const guess of [
    "DemoPassword123!",
    "password123",
    "admin123",
    "Admin123!",
    "password",
    "admin",
  ]) {
    if (await bcrypt.compare(guess, String(row.password)))
      console.log(`  *** MATCHES: ${guess}`);
  }
}

await prisma.$disconnect();
