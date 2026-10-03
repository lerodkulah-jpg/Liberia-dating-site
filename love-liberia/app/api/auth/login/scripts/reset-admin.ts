import { randomBytes } from "node:crypto";
import { prisma } from "../../../../../lib/prisma";
import { hashPassword } from "../../../../../lib/password";

const adminEmail = "admin@loveliberia.com";
const databaseUrl = process.env.DATABASE_URL;
const newPassword = process.env.ADMIN_RESET_PASSWORD;

async function resetAdminPassword() {
  if (!databaseUrl || !newPassword) {
    throw new Error("DATABASE_URL and a terminal-provided ADMIN_RESET_PASSWORD are required.");
  }

  if (process.env.ADMIN_RESET_CONFIRM_EMAIL !== adminEmail) {
    throw new Error("Admin email confirmation did not match.");
  }

  if (newPassword.length < 16) {
    throw new Error("Choose a new password with at least 16 characters.");
  }

  const database = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(database.protocol)) {
    throw new Error("This reset is restricted to the configured PostgreSQL database.");
  }

  if (process.env.ADMIN_RESET_CONFIRM_HOST !== database.hostname) {
    throw new Error("Database host confirmation did not match.");
  }

  const account = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true, isActive: true, isBanned: true },
  });

  if (account && !["ADMIN", "SUPER_ADMIN"].includes(account.role)) {
    throw new Error("An account with this email already exists but is not an admin; no account was changed.");
  }

  const passwordHash = await hashPassword(newPassword);

  if (account) {
    if (!account.isActive || account.isBanned) {
      throw new Error("The existing admin is inactive or banned; no account was changed.");
    }

    await prisma.user.update({
      where: { id: account.id },
      data: { password: passwordHash, failedLoginCount: 0, lockedUntil: null },
    });

    console.log("Existing admin password reset successfully. Account role and status were unchanged.");
    return;
  }

  await prisma.user.create({
    data: {
      firstName: "Love Liberia",
      username: `admin-${randomBytes(4).toString("hex")}`,
      email: adminEmail,
      password: passwordHash,
      dateOfBirth: new Date("1990-01-01"),
      gender: "Other",
      country: "Liberia",
      verified: true,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("New admin account created successfully. The password was not printed.");
}

resetAdminPassword()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin password reset failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });