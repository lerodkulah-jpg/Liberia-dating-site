import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

async function createAdmin() {
  const email = "admin@loveliberia.com";
  const password = "ChangeThisAdminPassword123!";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: "ADMIN" },
    });

    console.log("Existing user has been promoted to ADMIN.");
  } else {
    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        firstName: "Love Liberia",
        username: "admin",
        email,
        password: hashedPassword,
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