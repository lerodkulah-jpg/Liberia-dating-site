const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@loveliberia.com",
    password: "DemoPassword123!",
  }),
});
console.log("login:", response.status, (await response.text()).slice(0, 200));

const register = await fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName: "X",
    username: "x" + Date.now(),
    email: "x" + Date.now() + "@e.com",
    password: "password123",
    dateOfBirth: "1995-05-05",
    gender: "Man",
  }),
});
console.log(
  "register:",
  register.status,
  (await register.text()).slice(0, 200),
);
