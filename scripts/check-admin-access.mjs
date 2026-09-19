const login = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
  },
  body: JSON.stringify({
    email: "admin@loveliberia.com",
    password: "Admin123!",
  }),
});

console.log("Admin login:", login.status, (await login.text()).slice(0, 120));

const cookie = (login.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");
const admin = await fetch("http://localhost:3000/admin", {
  headers: { cookie },
  redirect: "manual",
});
const html = await admin.text();

console.log(
  "/admin with session:",
  admin.status,
  "| renders dashboard:",
  html.includes("Admin dashboard"),
);

// What an anonymous visitor sees (proves the guard is active)
const anon = await fetch("http://localhost:3000/admin", { redirect: "manual" });
console.log(
  "/admin without session:",
  anon.status,
  "| redirects to:",
  anon.headers.get("location") ?? "(no redirect)",
);
