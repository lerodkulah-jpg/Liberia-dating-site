const stamp = Date.now();
let pass = 0,
  fail = 0;

async function check(label, url, options, expect) {
  const r = await fetch(url, options);
  const t = await r.text();
  if (r.status === expect) {
    pass++;
    console.log(`PASS  ${label} -> ${r.status}`);
    return { r, t };
  }
  fail++;
  console.log(
    `FAIL  ${label} -> ${r.status} (expected ${expect})\n      ${t.slice(0, 160)}`,
  );
  return { r, t };
}

const json = {
  "Content-Type": "application/json",
  Origin: "http://localhost:3000",
};

await check("homepage", "http://localhost:3000/", {}, 200);
await check("register page", "http://localhost:3000/register", {}, 200);
await check("login page", "http://localhost:3000/login", {}, 200);

const reg = await check(
  "create account",
  "http://localhost:3000/api/auth/register",
  {
    method: "POST",
    headers: json,
    body: JSON.stringify({
      firstName: "Final",
      username: `final${stamp}`,
      email: `final${stamp}@example.com`,
      password: "password123",
      dateOfBirth: "1995-05-05",
      gender: "Man",
    }),
  },
  201,
);

const regCookie = (reg.r.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");
await check(
  "dashboard after signup",
  "http://localhost:3000/dashboard",
  { headers: { cookie: regCookie }, redirect: "manual" },
  200,
);

const admin = await check(
  "admin login",
  "http://localhost:3000/api/auth/login",
  {
    method: "POST",
    headers: json,
    body: JSON.stringify({
      email: "admin@loveliberia.com",
      password: "Admin123!",
    }),
  },
  200,
);

const adminCookie = (admin.r.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");
const dash = await check(
  "admin dashboard",
  "http://localhost:3000/admin",
  { headers: { cookie: adminCookie }, redirect: "manual" },
  200,
);
console.log(`      renders admin UI: ${dash.t.includes("Admin dashboard")}`);

await check(
  "cross-origin blocked",
  "http://localhost:3000/api/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://evil.example.com",
    },
    body: JSON.stringify({
      email: "admin@loveliberia.com",
      password: "Admin123!",
    }),
  },
  403,
);

console.log(`\n${pass} passed, ${fail} failed`);
