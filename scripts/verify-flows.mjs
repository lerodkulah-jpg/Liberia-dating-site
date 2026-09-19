const stamp = Date.now();
const email = `flow${stamp}@example.com`;

async function check(label, url, options, expect) {
  const response = await fetch(url, options);
  const text = await response.text();
  const ok = response.status === expect;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}: ${response.status} (expected ${expect})`,
  );
  if (!ok) console.log("      body:", text.slice(0, 200));
  return { response, text };
}

console.log("--- Registration ---");
const reg = await check(
  "register with browser Origin header",
  "http://localhost:3000/api/auth/register",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      firstName: "Flow",
      username: `flow${stamp}`,
      email,
      password: "password123",
      dateOfBirth: "1995-05-05",
      gender: "Man",
    }),
  },
  201,
);

const cookie = (reg.response.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");
console.log(
  "      session cookie issued:",
  cookie.includes("love_liberia_token"),
);

console.log("\n--- Dashboard with session ---");
const dash = await check(
  "dashboard",
  "http://localhost:3000/dashboard",
  { headers: { cookie }, redirect: "manual" },
  200,
);
console.log(
  "      dashboard rendered:",
  dash.text.includes("dashboard") || dash.text.length > 3000,
);

console.log("\n--- Duplicate registration rejected ---");
await check(
  "register same email again",
  "http://localhost:3000/api/auth/register",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      firstName: "Flow",
      username: `flow${stamp}`,
      email,
      password: "password123",
      dateOfBirth: "1995-05-05",
      gender: "Man",
    }),
  },
  409,
);

console.log("\n--- Login with the new account ---");
await check(
  "login created account",
  "http://localhost:3000/api/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({ email, password: "password123" }),
  },
  200,
);
