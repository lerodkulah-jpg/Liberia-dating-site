import type { Prisma } from "@prisma/client";

export async function spendWalletCredits(
  transaction: Prisma.TransactionClient,
  userId: string,
  credits: number,
  transactionType: string,
) {
  const debit = await transaction.creditWallet.updateMany({
    where: { userId, balance: { gte: credits } },
    data: { balance: { decrement: credits } },
  });
  if (debit.count !== 1) return false;

  await transaction.creditTransaction.create({
    data: { userId, type: transactionType, credits: -credits, amountCents: 0, status: "COMPLETED" },
  });
  return true;
}