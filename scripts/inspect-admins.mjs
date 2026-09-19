import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const admins = await prisma.user.findMany({
  where: { role: { in: ["ADMIN", "SUPER_ADMIN", "MODERATOR"] } },
  select: {
    email: true,
    role: true,
    password: true,
    isActive: true,
    lockedUntil: true,
    failedLoginCount: true,
  },
});

for (const admin of admins) {
  console.log(`\n${admin.email}  role=${admin.role}  active=${admin.isActive}`);
  console.log(
    `  hash prefix: ${admin.password.slice(0, 7)}  length: ${admin.password.length}`,
  );
  console.log(
    `  lockedUntil: ${admin.lockedUntil}  failedLoginCount: ${admin.failedLoginCount}`,
  );
  for (const guess of [
    "DemoPassword123!",
    "password123",
    "admin123",
    "Admin123!",
    "password",
  ]) {
    const ok = await bcrypt.compare(guess, admin.password);
    if (ok) console.log(`  *** MATCH: ${guess}`);
  }
}

await prisma.$disconnect();
