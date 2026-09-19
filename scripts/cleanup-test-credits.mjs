import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Remove the credits and transactions created while the mock-mode bypass existed,
// and reset the test member's wallet to zero.
const member = await prisma.user.findUnique({
  where: { email: "member.test@loveliberia.com" },
  select: { id: true },
});

if (!member) {
  console.log("Test member not found; nothing to reset.");
} else {
  const removedTx = await prisma.creditTransaction.deleteMany({
    where: { userId: member.id },
  });
  await prisma.creditWallet.upsert({
    where: { userId: member.id },
    update: { balance: 0 },
    create: { userId: member.id, balance: 0 },
  });
  console.log("Deleted test transactions:", removedTx.count);
  console.log("Wallet reset to 0.");
}

const flagged = await prisma.creditTransaction.count({
  where: { status: "FAILED" },
});
console.log("Transactions left in FAILED state:", flagged);

await prisma.$disconnect();
