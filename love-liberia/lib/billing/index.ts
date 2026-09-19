import { MockBillingAdapter } from "./adapters/mock";
import { StripeBillingAdapter } from "./adapters/stripe";
import type { BillingAdapter } from "./types";
import { getPaymentProvider } from "@/lib/payments/account";

const adapters: Record<string, () => BillingAdapter> = {
  mock: () => new MockBillingAdapter(),
  stripe: () => new StripeBillingAdapter(),
};

/**
 * Resolves the billing adapter.
 *
 * The mock adapter simulates checkout and never moves money. It is refused in
 * production so a misconfigured deployment fails loudly instead of handing out
 * free credits and memberships.
 */
export function getBillingAdapter(): BillingAdapter {
  const provider = getPaymentProvider();

  if (provider === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Mock billing is disabled in production. Set PAYMENT_PROVIDER to a live provider.");
  }

  return (adapters[provider] || adapters.mock)();
}
