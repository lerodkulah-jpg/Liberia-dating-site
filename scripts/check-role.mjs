import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      role: true,
      isActive: true,
      isBanned: true,
    },
    take: 20,
  });
  console.log("USERS WITH ROLE COLUMN:");
  console.table(users);
}

main()
  .catch((error) => {
    console.log(
      "QUERY FAILED:",
      error.message.split("\n").slice(-6).join("\n"),
    );
  })
  .finally(() => prisma.$disconnect());
