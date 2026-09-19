import crypto from "node:crypto";
import type {
  BillingAdapter,
  CheckoutRequest,
  CheckoutSession,
  CreditCheckoutRequest,
} from "../types";
import {
  getPayoutAccount,
  getSecretKey,
  isLivePaymentConfigured,
} from "@/lib/payments/account";
import { creditProducts, type CreditProduct } from "@/lib/wallet/catalog";

/**
 * Live billing adapter backed by Stripe Checkout.
 *
 * Money flows to the Stripe account identified by PAYMENT_STRIPE_SECRET_KEY and is
 * paid out to the bank account registered on that Stripe account
 * (PAYMENT_SETTLEMENT_BANK / PAYMENT_ACCOUNT_ID).
 *
 * This adapter only CREATES the checkout session. Value is granted solely by the
 * verified webhook (app/api/payments/webhook/route.ts) after the charge settles —
 * returning success here does not mean the member has paid.
 */

const STRIPE_API = "https://api.stripe.com/v1";

/** Monthly membership prices, in the smallest currency unit (cents). */
const PLAN_PRICES: Record<"PREMIUM" | "VIP", number> = {
  PREMIUM: 999,
  VIP: 1999,
};

async function stripeRequest(path: string, params: Record<string, string>) {
  const secret = getSecretKey();
  if (!secret) throw new Error("PAYMENT_STRIPE_SECRET_KEY is not set.");

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  const data = (await response.json()) as Record<string, unknown> & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      data.error?.message || `Stripe request failed (${response.status}).`,
    );
  return data;
}

export class StripeBillingAdapter implements BillingAdapter {
  private assertConfigured() {
    if (!isLivePaymentConfigured()) {
      throw new Error(
        "Live payments are not configured. Set PAYMENT_PROVIDER=stripe and PAYMENT_STRIPE_SECRET_KEY.",
      );
    }
  }

  async createCheckoutSession(
    request: CheckoutRequest,
  ): Promise<CheckoutSession> {
    this.assertConfigured();
    const account = getPayoutAccount();
    const reference = `ll_${request.plan.toLowerCase()}_${crypto.randomUUID()}`;

    const data = await stripeRequest("/checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": account.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(
        PLAN_PRICES[request.plan],
      ),
      "line_items[0][price_data][product_data][name]": `Love Liberia ${request.plan} membership`,
      // Our own reference, echoed back on the webhook so we can match the payment.
      client_reference_id: reference,
      "metadata[userId]": request.userId,
      "metadata[plan]": request.plan,
      "metadata[providerReference]": reference,
      success_url: `${request.returnUrl}?checkout=success&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.returnUrl}?checkout=cancelled`,
      // Stripe destination: funds to this connected account.
      ...(process.env.PAYMENT_STRIPE_DESTINATION_ACCOUNT
        ? {
            payment_intent_data_transfer_data_destination:
              process.env.PAYMENT_STRIPE_DESTINATION_ACCOUNT,
          }
        : {}),
    });

    return { id: reference, url: String(data.url ?? ""), plan: request.plan };
  }

  async createCreditCheckoutSession(
    request: CreditCheckoutRequest,
  ): Promise<CheckoutSession & { product: string }> {
    this.assertConfigured();
    const account = getPayoutAccount();
    const selected = creditProducts[request.product as CreditProduct];
    if (!selected) throw new Error("Unknown credit product.");

    const reference = `ll_${request.product.toLowerCase()}_${crypto.randomUUID()}`;

    const data = await stripeRequest("/checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": account.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(selected.amountCents),
      "line_items[0][price_data][product_data][name]": selected.label,
      client_reference_id: reference,
      "metadata[userId]": request.userId,
      "metadata[product]": request.product,
      "metadata[providerReference]": reference,
      success_url: `${request.returnUrl}?credits=success&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.returnUrl}?credits=cancelled`,
    });

    return {
      id: reference,
      url: String(data.url ?? ""),
      plan: "PREMIUM" as const,
      product: request.product,
    };
  }

  async cancelSubscription() {
    // Cancellation is recorded locally; the Stripe subscription (if any) is
    // cancelled through the same webhook contract.
    return Promise.resolve();
  }
}
