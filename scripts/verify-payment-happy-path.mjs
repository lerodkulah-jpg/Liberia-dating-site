import crypto from "node:crypto";

// Proves the happy path AND idempotency: a correctly signed webhook grants credits
// exactly once, and a retried delivery does not grant them again.

const BASE = "http://localhost:3000";
const SECRET = "dev-mock-webhook-secret-change-me";

function sign(body) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

async function wallet(cookie) {
  const response = await fetch(BASE + "/api/wallet", { headers: { cookie } });
  return response.json();
}

const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({
    email: "member.test@loveliberia.com",
    password: "Member123!",
  }),
});
const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : [])
  .map((c) => c.split(";")[0])
  .join("; ");

const before = await wallet(cookie);
console.log("balance before:", before.wallet.balance);

// Start a genuine checkout.
const start = await fetch(BASE + "/api/wallet", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, cookie },
  body: JSON.stringify({ product: "BOOST" }),
});
const startBody = await start.json();
const reference = startBody.session.id;
console.log("checkout started:", reference);
console.log("message:", startBody.message);

const afterStart = await wallet(cookie);
console.log(
  "balance after starting checkout (must be unchanged):",
  afterStart.wallet.balance,
);

// The provider pays us back with a correctly signed webhook.
const payload = JSON.stringify({
  event: "payment.success",
  reference,
  amountCents: 199,
});
const delivery = await fetch(BASE + "/api/payments/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-payment-signature": sign(payload),
  },
  body: payload,
});
console.log("\nwebhook 1:", delivery.status, await delivery.text());

const afterFirst = await wallet(cookie);
console.log("balance after confirmed payment:", afterFirst.wallet.balance);

// Providers retry. A second identical delivery must not double-grant.
const retry = await fetch(BASE + "/api/payments/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-payment-signature": sign(payload),
  },
  body: payload,
});
console.log("webhook retry:", retry.status, await retry.text());

const afterRetry = await wallet(cookie);
console.log(
  "balance after retry (must equal previous):",
  afterRetry.wallet.balance,
);

// Underpaying must be rejected: claim a smaller amount than the product costs.
const start2 = await fetch(BASE + "/api/wallet", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, cookie },
  body: JSON.stringify({ product: "BOOST" }),
});
const reference2 = (await start2.json()).session.id;
const underpay = JSON.stringify({
  event: "payment.success",
  reference: reference2,
  amountCents: 1,
});
const underpayRes = await fetch(BASE + "/api/payments/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-payment-signature": sign(underpay),
  },
  body: underpay,
});
console.log(
  "\nunderpaid webhook:",
  underpayRes.status,
  await underpayRes.text(),
);

const afterUnderpay = await wallet(cookie);
console.log(
  "balance after underpayment attempt:",
  afterUnderpay.wallet.balance,
);

console.log("\n--- summary ---");
console.log(
  "credits granted on valid payment:",
  afterFirst.wallet.balance - before.wallet.balance,
);
console.log(
  "idempotent on retry:",
  afterRetry.wallet.balance === afterFirst.wallet.balance,
);
console.log(
  "underpayment not credited:",
  afterUnderpay.wallet.balance === afterRetry.wallet.balance,
);
