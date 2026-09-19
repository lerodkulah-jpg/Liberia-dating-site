import { prisma } from "../love-liberia/lib/prisma";
import { hashPassword } from "../love-liberia/lib/password";

async function createAdmin() {
  const email = "admin@loveliberia.com";
  const password = "ChangeThisAdminPassword123!";

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "ADMIN",
        // Reset the password too: without this the script silently leaves the
        // old (unknown) password in place, so "login does not work" even
        // though the account was promoted successfully.
        password: await hashPassword(password),
        isActive: true,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    console.log("Existing user has been promoted to ADMIN and their password was reset.");
    console.log("Email:", email);
    console.log("Password:", password);
  } else {
    await prisma.user.create({
      data: {
        firstName: "Love Liberia",
        username: "admin",
        email,
        password: await hashPassword(password),
        dateOfBirth: new Date("1990-01-01"),
        gender: "Other",
        country: "Liberia",
        role: "ADMIN",
        verified: true,
        isActive: true,
      },
    });
    console.log("Admin account created.");
    console.log("Email:", email);
    console.log("Password:", password);
  }

  await prisma.$disconnect();
}

createAdmin().catch(async (error) => {
  console.error("Unable to create admin:", error);
  await prisma.$disconnect();
  process.exit(1);
});
