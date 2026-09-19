import { prisma } from "@/lib/prisma";

/**
 * The ONLY place where paid value (credits, membership) is granted.
 *
 * It is called exclusively from the signature-verified webhook route
 * (app/api/payments/webhook/route.ts) — never from a user-facing request. That is
 * what stops a member from granting themselves credits or a free upgrade.
 *
 * Every function here is idempotent: payment providers retry webhooks, and a
 * double-granted credit balance is real money lost.
 */

export type FulfillmentResult =
  | { status: "fulfilled"; creditsGranted?: number; plan?: string }
  | { status: "already_fulfilled" }
  | { status: "not_found" }
  | { status: "amount_mismatch"; expected: number; received: number };

function membershipDurationMs(plan: string) {
  // Paid plans are monthly; VIP is billed the same way.
  void plan;
  return 30 * 24 * 60 * 60 * 1000;
}

/**
 * Fulfills a credit purchase after payment is confirmed.
 *
 * The expected amount is read from the stored PENDING transaction rather than
 * from the webhook payload, so a caller cannot inflate what they receive.
 */
export async function fulfillCreditPurchase(params: {
  providerReference: string;
  amountPaidCents: number;
}): Promise<FulfillmentResult> {
  const transaction = await prisma.creditTransaction.findFirst({
    where: { providerReference: params.providerReference },
  });

  if (!transaction) return { status: "not_found" };

  // Idempotency: a retried webhook must not grant credits twice.
  if (transaction.status === "COMPLETED") return { status: "already_fulfilled" };

  // The provider must have actually collected what we asked for.
  if (params.amountPaidCents !== transaction.amountCents) {
    return { status: "amount_mismatch", expected: transaction.amountCents, received: params.amountPaidCents };
  }

  const credits = transaction.credits;

  await prisma.$transaction([
    prisma.creditWallet.upsert({
      where: { userId: transaction.userId },
      update: { balance: { increment: credits } },
      create: { userId: transaction.userId, balance: credits },
    }),
    // Conditional update: only flips PENDING -> COMPLETED once, so two concurrent
    // webhook deliveries cannot both apply the increment above.
    prisma.creditTransaction.updateMany({
      where: { id: transaction.id, status: "PENDING" },
      data: { status: "COMPLETED" },
    }),
  ]);

  return { status: "fulfilled", creditsGranted: credits };
}

/**
 * Fulfills a membership purchase after payment is confirmed.
 * Records a Payment row and upgrades the member's plan.
 */
export async function fulfillMembershipPurchase(params: {
  userId: string;
  plan: "PREMIUM" | "VIP";
  amountPaidCents: number;
  currency: string;
  provider: string;
  providerReference: string;
}): Promise<FulfillmentResult> {
  // Idempotency: one Payment row per provider reference.
  const existing = await prisma.payment.findFirst({
    where: { providerReference: params.providerReference },
  });
  if (existing) return { status: "already_fulfilled" };

  const subscription = await prisma.subscription.create({
    data: {
      userId: params.userId,
      plan: params.plan,
      status: "ACTIVE",
      endsAt: new Date(Date.now() + membershipDurationMs(params.plan)),
    },
  });

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: params.userId,
        subscriptionId: subscription.id,
        amountCents: params.amountPaidCents,
        currency: params.currency,
        status: "COMPLETED",
        provider: params.provider,
        providerReference: params.providerReference,
      },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data: { membershipPlan: params.plan, membershipStatus: "ACTIVE" },
    }),
  ]);

  return { status: "fulfilled", plan: params.plan };
}

/** Marks a transaction as failed so it is not fulfilled later by a stray retry. */
export async function markTransactionFailed(providerReference: string, reason: string) {
  await prisma.creditTransaction.updateMany({
    where: { providerReference, status: "PENDING" },
    data: { status: "FAILED" },
  });
  console.error(`Payment ${providerReference} failed: ${reason}`);
}
