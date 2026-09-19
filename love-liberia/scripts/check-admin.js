import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      role: true,
      isActive: true,
      lockedUntil: true,
      failedLoginCount: true,
      password: true,
    },
  });

  console.log("TOTAL USERS:", users.length);
  for (const u of users) {
    console.log(
      "-",
      u.email,
      "| role:",
      u.role,
      "| active:",
      u.isActive,
      "| failed:",
      u.failedLoginCount,
      "| locked:",
      u.lockedUntil,
    );
  }

  const admin = users.find((u) => u.email === "admin@loveliberia.com");
  if (!admin) {
    console.log("\nADMIN USER: NOT FOUND");
  } else {
    console.log("\nADMIN USER: found");
    const matches = await bcrypt.compare(
      "ChangeThisAdminPassword+231!",
      admin.password,
    );
    console.log("Password 'ChangeThisAdminPassword123!' matches:", matches);
    console.log("Hash prefix:", String(admin.password).slice(0, 7));
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
