import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBillingAdapter } from "@/lib/billing";
import type { MembershipPlan } from "@/lib/billing/types";
import { publicUrl } from "@/lib/security/request";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { MEMBERSHIP_PRICES } from "@/lib/billing/plans";

export async function POST(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const payload = await request.json();
    const { plan, paymentMethod, mobileProvider, mobileAccountName, mobileNumber } = payload;

    if (plan !== "PREMIUM" && plan !== "VIP") return NextResponse.json({ error: "Choose a paid membership plan." }, { status: 400 });
    const paidPlan = plan as "PREMIUM" | "VIP";
    if (paymentMethod !== undefined && paymentMethod !== "CARD" && paymentMethod !== "MOBILE_MONEY" && paymentMethod !== "PAYPAL") {
      return NextResponse.json({ error: "Choose a supported payment method." }, { status: 400 });
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
          amountCents: MEMBERSHIP_PRICES[paidPlan],
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

    const provider = paymentMethod === "PAYPAL" || paymentMethod === "CARD" ? "paypal" : undefined;
    const session = await getBillingAdapter(provider).createCheckoutSession({ userId, plan: plan as Exclude<MembershipPlan, "FREE">, returnUrl: publicUrl(request, "/membership") });
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
