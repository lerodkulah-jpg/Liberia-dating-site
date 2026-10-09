import type {
  BillingAdapter,
  CheckoutRequest,
  CheckoutSession,
  CreditCheckoutRequest,
} from "../types";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { creditProducts, type CreditProduct } from "@/lib/wallet/catalog";
import { MEMBERSHIP_PRICES } from "@/lib/billing/plans";

export class PayPalBillingAdapter implements BillingAdapter {
  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession> {
    const order = await createPayPalOrder({
      amountCents: MEMBERSHIP_PRICES[request.plan],
      customId: `membership|${request.userId}|${request.plan}`,
      returnUrl: request.returnUrl,
      cancelUrl: `${request.returnUrl}?checkout=cancelled`,
    });
    return { ...order, plan: request.plan };
  }

  async createCreditCheckoutSession(
    request: CreditCheckoutRequest,
  ): Promise<CheckoutSession & { product: string }> {
    const product = Object.hasOwn(creditProducts, request.product)
      ? creditProducts[request.product as CreditProduct]
      : null;
    if (!product) throw new Error("Unknown credit product.");

    const order = await createPayPalOrder({
      amountCents: product.amountCents,
      customId: `wallet|${request.userId}|${request.product}`,
      returnUrl: request.returnUrl,
      cancelUrl: `${request.returnUrl}?credits=cancelled`,
    });
    return { ...order, plan: "PREMIUM", product: request.product };
  }

  async cancelSubscription() {
    return Promise.resolve();
  }
}
