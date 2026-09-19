// Confirms that in mock mode the webhook grants nothing, and that the signature
// check is what stands between an attacker and free credits in live mode.

const BASE = "http://localhost:3000";

// 1. Forged webhook in mock mode must not create or complete anything.
const forged = await fetch(BASE + "/api/payments/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-payment-signature": "deadbeef",
  },
  body: JSON.stringify({
    event: "payment.success",
    reference: "forged_ref",
    amountCents: 199,
  }),
});
console.log("forged webhook status (mock mode):", forged.status);
console.log("  body:", (await forged.text()).slice(0, 200));

// 2. A forged webhook referencing a REAL pending transaction must not complete it.
//    Sign in as the test member and start a genuine checkout first.
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
console.log("\nmember login:", login.status);

const start = await fetch(BASE + "/api/wallet", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, cookie },
  body: JSON.stringify({ product: "BOOST" }),
});
const startBody = await start.json();
const realRef = startBody.session && startBody.session.id;
console.log("started checkout, ref:", realRef);
console.log("  message:", startBody.message);

const balanceRes = await fetch(BASE + "/api/wallet", { headers: { cookie } });
const balance = (await balanceRes.json()).wallet.balance;
console.log("  balance after starting checkout:", balance);

// Now try to complete that real reference with a forged signature.
const attacker = await fetch(BASE + "/api/payments/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-payment-signature": "forged-signature",
  },
  body: JSON.stringify({
    event: "payment.success",
    reference: realRef,
    amountCents: 199,
  }),
});
console.log("\nattack webhook status (mock mode):", attacker.status);
console.log("  body:", (await attacker.text()).slice(0, 200));

const afterRes = await fetch(BASE + "/api/wallet", { headers: { cookie } });
const afterWallet = await afterRes.json();
console.log("  balance after attack:", afterWallet.wallet.balance);
console.log(
  "  transaction statuses:",
  afterWallet.transactions.map((t) => t.type + ":" + t.status).join(", "),
);

// 3. Confirm the signature check itself rejects wrong signatures (unit level).
const crypto = await import("node:crypto");
function verify(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const candidates = [
    expected,
    Buffer.from(expected, "hex").toString("base64"),
  ];
  return candidates.some((c) => {
    const a = Buffer.from(c);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

const secret = "test_secret";
const body = JSON.stringify({ event: "payment.success", reference: "r1" });
const good = crypto.createHmac("sha256", secret).update(body).digest("hex");

console.log("\n--- signature verification ---");
console.log("valid signature accepted:  ", verify(body, good, secret));
console.log(
  "forged signature rejected: ",
  verify(body, "deadbeef", secret) === false,
);
console.log(
  "tampered body rejected:    ",
  verify(body + " ", good, secret) === false,
);
console.log("missing secret rejected:   ", verify(body, good, "") === false);
