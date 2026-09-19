import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBillingAdapter } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { creditProducts, type CreditProduct } from "@/lib/wallet/catalog";
import { getPaymentProvider } from "@/lib/payments/account";
import { sameOrigin, publicUrl } from "@/lib/security/request";

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const wallet = await prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
  const transactions = await prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ wallet, transactions, products: creditProducts });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const payload = await request.json();
    const { product, paymentMethod, bankName, bankAccountName, bankAccountNumber, mobileProvider, mobileAccountName, mobileNumber } = payload;
    if (!(product in creditProducts)) return NextResponse.json({ error: "Choose a valid credit package." }, { status: 400 });
    const key = product as CreditProduct;
    const selected = creditProducts[key];

    if (paymentMethod === "BANK_TRANSFER") {
      if (!bankName || !bankAccountName || !bankAccountNumber) {
        return NextResponse.json({ error: "Please provide your bank name, account name, and account number." }, { status: 400 });
      }

      const providerReference = `manual_bank_${Date.now()}_${userId}`;
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: key,
          credits: selected.credits,
          amountCents: selected.amountCents,
          status: "PENDING",
          providerReference,
        },
      });

      return NextResponse.json({
        requiresManualVerification: true,
        message: "Your bank payment is pending admin review. Credits will be added after approval.",
      });
    }

    if (paymentMethod === "MOBILE_MONEY") {
      if (!mobileProvider || !mobileAccountName || !mobileNumber) {
        return NextResponse.json({ error: "Please provide your mobile money provider, account name, and mobile number." }, { status: 400 });
      }

      const providerReference = `manual_mobile_${Date.now()}_${userId}`;
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: key,
          credits: selected.credits,
          amountCents: selected.amountCents,
          status: "PENDING",
          providerReference,
        },
      });

      return NextResponse.json({
        requiresManualVerification: true,
        message: "Your mobile money payment is pending admin review. Credits will be added after approval.",
      });
    }

    // Default checkout flow for card-based or external payment processing.
    const session = await getBillingAdapter().createCreditCheckoutSession({ userId, product: key, amountCents: selected.amountCents, returnUrl: publicUrl(request, "/wallet") });

    const mockSettlement = getPaymentProvider() === "mock" && process.env.NODE_ENV !== "production";

    if (mockSettlement) {
      await prisma.$transaction([
        prisma.creditWallet.upsert({ where: { userId }, update: { balance: { increment: selected.credits } }, create: { userId, balance: selected.credits } }),
        prisma.creditTransaction.create({ data: { userId, type: key, credits: selected.credits, amountCents: selected.amountCents, status: "COMPLETED", providerReference: session.id } }),
      ]);
    } else {
      await prisma.creditTransaction.create({ data: { userId, type: key, credits: selected.credits, amountCents: selected.amountCents, status: "PENDING", providerReference: session.id } });
    }

    return NextResponse.json({ session, message: mockSettlement ? "Credits added to your wallet." : "Checkout started. Credits appear once payment is confirmed." });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json({ error: "Unable to start credit purchase." }, { status: 500 });
  }
}
