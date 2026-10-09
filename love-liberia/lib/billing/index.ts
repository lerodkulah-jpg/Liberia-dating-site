import { MockBillingAdapter } from "./adapters/mock";
import { StripeBillingAdapter } from "./adapters/stripe";
import { PayPalBillingAdapter } from "./adapters/paypal";
import type { BillingAdapter } from "./types";
import { getPaymentProvider, type PaymentProvider } from "@/lib/payments/account";

const adapters: Partial<Record<PaymentProvider, () => BillingAdapter>> = {
  mock: () => new MockBillingAdapter(),
  stripe: () => new StripeBillingAdapter(),
  paypal: () => new PayPalBillingAdapter(),
};

/**
 * Resolves the billing adapter.
 *
 * The mock adapter simulates checkout and never moves money. It is refused in
 * production so a misconfigured deployment fails loudly instead of handing out
 * free credits and memberships.
 */
export function getBillingAdapter(selectedProvider?: PaymentProvider): BillingAdapter {
  const provider = selectedProvider || getPaymentProvider();

  if (provider === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Mock billing is disabled in production. Set PAYMENT_PROVIDER to a live provider.");
  }

  const createAdapter = adapters[provider];
  if (!createAdapter) throw new Error(`Billing adapter for ${provider} is not implemented.`);
  return createAdapter();
}
