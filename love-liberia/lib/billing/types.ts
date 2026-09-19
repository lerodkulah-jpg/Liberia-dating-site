export type MembershipPlan = "FREE" | "PREMIUM" | "VIP";

export type CheckoutRequest = {
  userId: string;
  plan: Exclude<MembershipPlan, "FREE">;
  returnUrl: string;
};

export type CheckoutSession = {
  id: string;
  url: string;
  plan: Exclude<MembershipPlan, "FREE">;
};

export type CreditCheckoutRequest = {
  userId: string;
  product: string;
  amountCents: number;
  returnUrl: string;
};

export interface BillingAdapter {
  createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession>;
  createCreditCheckoutSession(request: CreditCheckoutRequest): Promise<CheckoutSession & { product: string }>;
  cancelSubscription(userId: string): Promise<void>;
}
