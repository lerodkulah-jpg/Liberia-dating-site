// Reproduces the "Choose Premium" click end to end.
const BASE = "http://localhost:3000";

const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({
    email: "member.test@loveliberia.com",
    password: "Member123!",
  }),
});
console.log("login:", login.status);
const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : [])
  .map((c) => c.split(";")[0])
  .join("; ");

// Step 1: page load calls GET
const get = await fetch(BASE + "/api/billing/checkout", {
  headers: { cookie },
});
console.log("\nGET /api/billing/checkout:", get.status);
console.log("  body:", (await get.text()).slice(0, 300));

// Step 2: clicking Premium calls POST
const post = await fetch(BASE + "/api/billing/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, cookie },
  body: JSON.stringify({ plan: "PREMIUM" }),
});
const postBody = await post.text();
console.log("\nPOST /api/billing/checkout {plan: PREMIUM}:", post.status);
console.log("  body:", postBody.slice(0, 500));

// Step 3: what the browser would navigate to
try {
  const data = JSON.parse(postBody);
  const url = data.session && data.session.url;
  console.log("\nredirect URL:", url);
  if (url) {
    const followed = await fetch(url, {
      headers: { cookie },
      redirect: "manual",
    });
    console.log(
      "  following it ->",
      followed.status,
      "location:",
      followed.headers.get("location") || "(none)",
    );
  }
} catch {
  console.log("  (no session.url to follow)");
}
