/**
 * Payment payout account configuration.
 *
 * This is the account that RECEIVES the money. It is read from environment
 * variables only — never hard-code keys here, because this file is committed to
 * source control and anything in it is visible to anyone with repo access.
 *
 * Set these in love-liberia/.env (see .env.payment.example):
 *
 *   PAYMENT_PROVIDER        stripe | flutterwave | paystack | mock
 *   PAYMENT_ACCOUNT_NAME    Your registered business name
 *   PAYMENT_ACCOUNT_EMAIL   Email on the provider account
 *   PAYMENT_ACCOUNT_ID      Provider account / merchant ID
 *   PAYMENT_CURRENCY        Settlement currency, e.g. USD or LRD
 *   PAYMENT_SETTLEMENT_BANK Bank or mobile-money account that receives payouts
 *   PAYMENT_<PROVIDER>_PUBLIC_KEY
 *   PAYMENT_<PROVIDER>_SECRET_KEY
 *   PAYMENT_<PROVIDER>_WEBHOOK_SECRET
 */

export type PaymentProvider = "stripe" | "flutterwave" | "paystack" | "mock";

export type PayoutAccount = {
  provider: PaymentProvider;
  accountName: string;
  accountEmail: string;
  accountId: string;
  currency: string;
  settlementBank: string;
};

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getPaymentProvider(): PaymentProvider {
  const value = readEnv("PAYMENT_PROVIDER").toLowerCase();
  if (value === "stripe" || value === "flutterwave" || value === "paystack")
    return value;
  return "mock";
}

export function isLivePaymentConfigured(): boolean {
  return getPaymentProvider() !== "mock" && Boolean(getSecretKey());
}

/** Returns the name of the env var holding the secret key for the active provider. */
export function getSecretKeyVar(): string {
  switch (getPaymentProvider()) {
    case "stripe":
      return "PAYMENT_STRIPE_SECRET_KEY";
    case "flutterwave":
      return "PAYMENT_FLUTTERWAVE_SECRET_KEY";
    case "paystack":
      return "PAYMENT_PAYSTACK_SECRET_KEY";
    default:
      return "";
  }
}

export function getPublicKeyVar(): string {
  switch (getPaymentProvider()) {
    case "stripe":
      return "PAYMENT_STRIPE_PUBLIC_KEY";
    case "flutterwave":
      return "PAYMENT_FLUTTERWAVE_PUBLIC_KEY";
    case "paystack":
      return "PAYMENT_PAYSTACK_PUBLIC_KEY";
    default:
      return "";
  }
}

export function getSecretKey(): string {
  const variable = getSecretKeyVar();
  return variable ? readEnv(variable) : "";
}

export function getWebhookSecret(): string {
  switch (getPaymentProvider()) {
    case "stripe":
      return readEnv("PAYMENT_STRIPE_WEBHOOK_SECRET");
    case "flutterwave":
      return readEnv("PAYMENT_FLUTTERWAVE_WEBHOOK_SECRET");
    case "paystack":
      return readEnv("PAYMENT_PAYSTACK_WEBHOOK_SECRET");
    default:
      return readEnv("PAYMENT_MOCK_WEBHOOK_SECRET");
  }
}

/** The account money is paid out to. Surfaced to admins and used in receipts. */
export function getPayoutAccount(): PayoutAccount {
  return {
    provider: getPaymentProvider(),
    accountName: readEnv("PAYMENT_ACCOUNT_NAME") || "Not configured",
    accountEmail: readEnv("PAYMENT_ACCOUNT_EMAIL") || "Not configured",
    accountId: readEnv("PAYMENT_ACCOUNT_ID") || "Not configured",
    currency: readEnv("PAYMENT_CURRENCY") || "USD",
    settlementBank: readEnv("PAYMENT_SETTLEMENT_BANK") || "Not configured",
  };
}

/**
 * Safe to show in a UI or logs: reports which settings are present without
 * ever exposing a key value.
 */
export function describePayoutAccount() {
  const account = getPayoutAccount();
  return {
    ...account,
    accountId:
      account.accountId === "Not configured"
        ? account.accountId
        : `***${account.accountId.slice(-4)}`,
    liveMode: isLivePaymentConfigured(),
    hasSecretKey: Boolean(getSecretKey()),
    hasWebhookSecret: Boolean(getWebhookSecret()),
    publicKeyVar: getPublicKeyVar(),
    secretKeyVar: getSecretKeyVar(),
  };
}
