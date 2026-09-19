import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { describePayoutAccount } from "@/lib/payments/account";

/**
 * Admin view of the payment configuration.
 *
 * Reports which payout account is configured and whether each secret is present.
 * It never returns the key values themselves.
 */
export async function GET() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!admin || !can(admin.role, "manage_subscriptions")) {
    return NextResponse.json({ error: "You do not have access to payment settings." }, { status: 403 });
  }

  const completedAggregate = await prisma.creditTransaction.aggregate({
    _sum: { amountCents: true },
    where: { status: "COMPLETED", amountCents: { gt: 0 } },
  });

  const pendingCredits = await prisma.creditTransaction.count({ where: { status: "PENDING" } });

  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { amountCents: true, currency: true, status: true, provider: true, createdAt: true },
  });

  const pendingManualPayments = await prisma.payment.findMany({
    where: { status: "PENDING", provider: { in: ["BANK_TRANSFER", "MOBILE_MONEY"] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, username: true, email: true, phone: true },
      },
      subscription: {
        select: { id: true, plan: true, status: true },
      },
    },
  });

  return NextResponse.json({
    payoutAccount: describePayoutAccount(),
    revenue: {
      completedCents: completedAggregate._sum.amountCents ?? 0,
      pendingTransactions: pendingCredits,
    },
    recentPayments,
    pendingManualPayments: pendingManualPayments.map((payment) => ({
      id: payment.id,
      amountCents: payment.amountCents,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      createdAt: payment.createdAt,
      user: payment.user,
      subscription: payment.subscription,
    })),
  });
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!admin || !can(admin.role, "manage_subscriptions")) {
    return NextResponse.json({ error: "You do not have access to payment settings." }, { status: 403 });
  }

  const payload = await request.json();
  const paymentId = typeof payload.paymentId === "string" ? payload.paymentId : "";
  const action = typeof payload.action === "string" ? payload.action : "";

  if (!paymentId || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "A valid paymentId and action are required." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  if (action === "APPROVE") {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "COMPLETED" },
      }),
      prisma.subscription.update({
        where: { id: payment.subscriptionId ?? "" },
        data: { status: "ACTIVE", endsAt: thirtyDaysFromNow },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { membershipPlan: payment.subscription?.plan || "PREMIUM", membershipStatus: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({ message: "Payment approved and membership activated." });
  }

  await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: { status: "REJECTED" } }),
    prisma.subscription.update({
      where: { id: payment.subscriptionId ?? "" },
      data: { status: "CANCELLED", endsAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Payment rejected and subscription cancelled." });
}
