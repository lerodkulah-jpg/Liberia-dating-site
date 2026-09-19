import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBillingAdapter } from "@/lib/billing";
import type { MembershipPlan } from "@/lib/billing/types";
import { publicUrl } from "@/lib/security/request";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const payload = await request.json();
    const { plan, paymentMethod, bankName, bankAccountName, bankAccountNumber, mobileProvider, mobileAccountName, mobileNumber, paymentReference } = payload;

    if (plan !== "PREMIUM" && plan !== "VIP") return NextResponse.json({ error: "Choose a paid membership plan." }, { status: 400 });

    if (paymentMethod === "BANK_TRANSFER") {
      if (!bankName || !bankAccountName || !bankAccountNumber) {
        return NextResponse.json({ error: "Please provide your bank name, account name, and account number." }, { status: 400 });
      }

      const providerReference = `manual_bank_${Date.now()}_${userId}`;
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: "PENDING",
          endsAt: null,
        },
      });

      await prisma.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amountCents: 999,
          currency: "USD",
          status: "PENDING",
          provider: "BANK_TRANSFER",
          providerReference,
        },
      });

      return NextResponse.json({
        requiresManualVerification: true,
        message: "Your bank payment has been submitted for admin review. It will be approved before your membership is activated.",
        session: { id: providerReference, url: "", plan },
      });
    }

    if (paymentMethod === "MOBILE_MONEY") {
      if (!mobileProvider || !mobileAccountName || !mobileNumber) {
        return NextResponse.json({ error: "Please provide your mobile money provider, account name, and mobile number." }, { status: 400 });
      }

      const providerReference = `manual_mobile_${Date.now()}_${userId}`;
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: "PENDING",
          endsAt: null,
        },
      });

      await prisma.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amountCents: 999,
          currency: "USD",
          status: "PENDING",
          provider: "MOBILE_MONEY",
          providerReference,
        },
      });

      return NextResponse.json({
        requiresManualVerification: true,
        message: "Your mobile money payment has been submitted for admin review. It will be approved before your membership is activated.",
        session: { id: providerReference, url: "", plan },
      });
    }

    const session = await getBillingAdapter().createCheckoutSession({ userId, plan: plan as Exclude<MembershipPlan, "FREE">, returnUrl: publicUrl(request, "/membership") });
    return NextResponse.json({ session, requiresManualVerification: false });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}

export async function GET() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { membershipPlan: true, membershipStatus: true } });
  return NextResponse.json({ membership: user || { membershipPlan: "FREE", membershipStatus: "ACTIVE" } });
}
