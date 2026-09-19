const candidates = [
  ["admin@loveliberia.com", "DemoPassword123!"],
  ["admin@loveliberia.com", "password123"],
  ["admin@loveliberia.com", "Admin123!"],
  ["lawsonflomo053@gmail.com", "DemoPassword123!"],
  ["lawsonflomo053@gmail.com", "password123"],
];

for (const [email, password] of candidates) {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.text();
  console.log(
    `${response.status}  ${email} / ${password}  ->  ${body.slice(0, 90)}`,
  );
}
