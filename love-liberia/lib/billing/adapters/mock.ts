import crypto from "node:crypto";
import type { BillingAdapter, CheckoutRequest, CheckoutSession, CreditCheckoutRequest } from "../types";

export class MockBillingAdapter implements BillingAdapter {
  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession> {
    const sessionId = `mock_${crypto.randomUUID()}`;
    const url = `${request.returnUrl}?checkout=success&session=${encodeURIComponent(sessionId)}&plan=${request.plan}`;
    return { id: sessionId, url, plan: request.plan };
  }

  async cancelSubscription() {
    return Promise.resolve();
  }

  async createCreditCheckoutSession(request: CreditCheckoutRequest) {
    const sessionId = `mock_${crypto.randomUUID()}`;
    return {
      id: sessionId,
      url: `${request.returnUrl}?credits=success&session=${encodeURIComponent(sessionId)}&product=${request.product}`,
      product: request.product,
      plan: "PREMIUM" as const,
    };
  }
}
