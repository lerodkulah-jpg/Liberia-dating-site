import { NextResponse } from "next/server";
import { MEMBERSHIP_PRICES } from "@/lib/billing/plans";
import { creditProducts, type CreditProduct } from "@/lib/wallet/catalog";
import { prisma } from "@/lib/prisma";
import { fulfillCreditPurchase, fulfillMembershipPurchase } from "@/lib/payments/fulfillment";
import { capturePayPalOrder, getPayPalOrder, type PayPalOrder } from "@/lib/payments/paypal";

export const runtime = "nodejs";

function returnTo(requestUrl: string, destination: "membership" | "wallet", result: "success" | "cancelled" | "error") {
  const target = new URL(destination, new URL(requestUrl).origin);
  target.searchParams.set(destination === "wallet" ? "credits" : "checkout", result);
  return NextResponse.redirect(target);
}

function paidCapture(order: PayPalOrder) {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  if (capture?.status !== "COMPLETED" || !capture.amount?.value || capture.amount.currency_code !== "USD") {
    return null;
  }
  const value = Number(capture.amount.value);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = url.searchParams.get("destination");
  if (destination !== "membership" && destination !== "wallet") {
    return NextResponse.json({ error: "Invalid PayPal return destination." }, { status: 400 });
  }

  const orderId = url.searchParams.get("token");
  if (!orderId) return returnTo(request.url, destination, "cancelled");

  try {
    const existingOrder = await getPayPalOrder(orderId);
    const purchase = existingOrder.purchase_units?.[0];
    const fields = purchase?.custom_id?.split("|") ?? [];
    const amountCents = Number(purchase?.amount?.value) * 100;
    const currency = purchase?.amount?.currency_code;
    if (!purchase || currency !== "USD" || !Number.isFinite(amountCents)) {
      return returnTo(request.url, destination, "error");
    }

    const [kind, userId, item] = fields;
    if ((kind === "wallet") !== (destination === "wallet") || !userId || !item) {
      return returnTo(request.url, destination, "error");
    }

    let order = existingOrder;
    if (order.status !== "COMPLETED") {
      if (order.status !== "APPROVED") return returnTo(request.url, destination, "error");
      order = await capturePayPalOrder(orderId);
    }
    const paidCents = paidCapture(order);
    if (paidCents === null || paidCents !== amountCents) {
      return returnTo(request.url, destination, "error");
    }

    if (kind === "wallet") {
      if (!Object.hasOwn(creditProducts, item)) return returnTo(request.url, destination, "error");
      const product = item as CreditProduct;
      const transaction = await prisma.creditTransaction.findFirst({
        where: { providerReference: orderId, userId, type: product },
      });
      if (!transaction) return returnTo(request.url, destination, "error");

      const result = await fulfillCreditPurchase({ providerReference: orderId, amountPaidCents: paidCents });
      if (result.status !== "fulfilled" && result.status !== "already_fulfilled") {
        return returnTo(request.url, destination, "error");
      }
    } else {
      if (item !== "PREMIUM" && item !== "VIP") return returnTo(request.url, destination, "error");
      if (paidCents !== MEMBERSHIP_PRICES[item]) return returnTo(request.url, destination, "error");

      const result = await fulfillMembershipPurchase({
        userId,
        plan: item,
        amountPaidCents: paidCents,
        currency: "USD",
        provider: "paypal",
        providerReference: orderId,
      });
      if (result.status !== "fulfilled" && result.status !== "already_fulfilled") {
        return returnTo(request.url, destination, "error");
      }
    }

    return returnTo(request.url, destination, "success");
  } catch (error) {
    console.error("PayPal order capture error:", error);
    return returnTo(request.url, destination, "error");
  }
}
