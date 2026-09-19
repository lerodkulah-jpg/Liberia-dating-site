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

console.log("LOGIN STATUS:", login.status);
console.log("BODY:", (await login.text()).slice(0, 300));
console.log(
  "SET-COOKIE present:",
  (login.headers.getSetCookie?.() ?? []).length > 0,
);

const cookie = (login.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");

const admin = await fetch("http://localhost:3000/admin", {
  headers: { cookie },
  redirect: "manual",
});
console.log("\n/admin STATUS:", admin.status);
console.log(
  "/admin location:",
  admin.headers.get("location") ?? "(rendered directly)",
);
const html = await admin.text();
console.log(
  "/admin contains 'Admin dashboard':",
  html.includes("Admin dashboard"),
);
