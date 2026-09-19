import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "admin@loveliberia.com";
const NEW_PASSWORD = "ChangeThisAdminPassword+231!";

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { email: EMAIL },
      data: {
        password: hash,
        role: "ADMIN",
        isActive: true,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    console.log("Admin password reset and account unlocked:", EMAIL);
  } else {
    await prisma.user.create({
      data: {
        firstName: "Love Liberia",
        username: "admin",
        email: EMAIL,
        password: hash,
        dateOfBirth: new Date("1990-01-01"),
        gender: "Other",
        country: "Liberia",
        role: "ADMIN",
        verified: true,
        isActive: true,
      },
    });
    console.log("Admin account created:", EMAIL);
  }

  console.log("Password:", NEW_PASSWORD);
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
