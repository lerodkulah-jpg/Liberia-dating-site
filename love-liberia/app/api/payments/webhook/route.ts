import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, getWebhookSecret, getPayoutAccount } from "@/lib/payments/account";
import { fulfillCreditPurchase, fulfillMembershipPurchase, markTransactionFailed } from "@/lib/payments/fulfillment";
import { creditProducts, type CreditProduct } from "@/lib/wallet/catalog";

/**
 * Payment provider webhook — the ONLY entry point that grants paid value.
 *
 * Security properties that must be preserved if this is edited:
 *  1. The signature is verified against PAYMENT_<PROVIDER>_WEBHOOK_SECRET before
 *     any database write. Without it anyone could POST here and mint credits.
 *  2. Comparison uses timingSafeEqual to avoid leaking the signature by timing.
 *  3. Amounts are re-read from our own stored PENDING record, never trusted from
 *     the request body, so a caller cannot underpay and receive full value.
 *  4. Fulfillment is idempotent (see lib/payments/fulfillment.ts) because
 *     providers retry deliveries.
 *
 * Configure the endpoint in the provider dashboard as:
 *   https://<your-domain>/api/payments/webhook
 */

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Providers differ on whether the signature is hex or base64; accept either.
  const candidates = [expected, Buffer.from(expected, "hex").toString("base64")];

  return candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const secret = getWebhookSecret();
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-payment-signature") ||
    request.headers.get("verif-hash") ||
    request.headers.get("x-paystack-signature") ||
    request.headers.get("stripe-signature");

  // Mock mode is local development only and refuses to run in production.
  const isMock = provider === "mock";
  if (isMock && process.env.NODE_ENV === "production") {
    console.error("Refusing to process a mock webhook in production. Configure a real payment provider.");
    return NextResponse.json({ error: "Payment provider not configured." }, { status: 503 });
  }

  // The signature is verified in EVERY mode, including mock. Skipping it for mock
  // would let an attacker who guesses a payment reference grant themselves credits
  // in any deployment still running the default provider. Mock mode therefore also
  // requires PAYMENT_MOCK_WEBHOOK_SECRET to be set.
  if (!secret) {
    console.error(`Webhook rejected: no webhook secret configured for provider ${provider}.`);
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    console.error(`Rejected webhook: invalid signature from ${provider}.`);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : typeof payload.type === "string" ? payload.type : "";
  const reference = typeof payload.reference === "string" ? payload.reference : typeof payload.providerReference === "string" ? payload.providerReference : "";
  const metadata = (payload.metadata ?? {}) as Record<string, unknown>;
  const amountPaidCents = Number(payload.amountCents ?? payload.amount ?? 0);

  if (!reference) return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });

  try {
    const isFailure = /fail|declin|cancel|abort/i.test(event);
    if (isFailure) {
      await markTransactionFailed(reference, event);
      return NextResponse.json({ received: true, status: "failed" });
    }

    // ---- Credit (wallet) purchase ----
    const pendingCredit = await prisma.creditTransaction.findFirst({ where: { providerReference: reference } });
    if (pendingCredit) {
      const result = await fulfillCreditPurchase({ providerReference: reference, amountPaidCents });
      if (result.status === "amount_mismatch") {
        // Never fulfil a partial payment; flag it for a human.
        await markTransactionFailed(reference, `amount mismatch: expected ${result.expected}, got ${result.received}`);
        return NextResponse.json({ error: "Amount mismatch." }, { status: 409 });
      }
      return NextResponse.json({ received: true, result: result.status });
    }

    // ---- Membership purchase ----
    const plan = typeof metadata.plan === "string" ? metadata.plan.toUpperCase() : "";
    const userId = typeof metadata.userId === "string" ? metadata.userId : "";
    if (userId && (plan === "PREMIUM" || plan === "VIP")) {
      const result = await fulfillMembershipPurchase({
        userId,
        plan: plan as "PREMIUM" | "VIP",
        amountPaidCents,
        currency: getPayoutAccount().currency,
        provider,
        providerReference: reference,
      });
      return NextResponse.json({ received: true, result: result.status });
    }

    // A webhook for something we did not initiate: acknowledge so the provider
    // stops retrying, but grant nothing.
    console.error(`Webhook ${reference} (${event}) matched no pending transaction.`);
    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // 500 tells the provider to retry; fulfillment is idempotent so this is safe.
    return NextResponse.json({ error: "Unable to process webhook." }, { status: 500 });
  }
}

export async function GET() {
  const account = getPayoutAccount();
  // Health/diagnostic endpoint. Reports configuration presence, never key values.
  return NextResponse.json({
    provider: account.provider,
    receivingAccount: account.accountName,
    currency: account.currency,
    settlementBank: account.settlementBank,
    webhookConfigured: Boolean(getWebhookSecret()),
    productCount: Object.keys(creditProducts).length as number,
  });
}

// Re-exported so the catalog and webhook cannot drift apart.
export type { CreditProduct };
