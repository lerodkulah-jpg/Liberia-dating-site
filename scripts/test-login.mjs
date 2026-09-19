async function login(label, email, password) {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email, password }),
    });
    const text = await response.text();
    const cookies = response.headers.getSetCookie?.() ?? [];
    console.log(`\n[${label}] STATUS ${response.status}`);
    console.log("BODY:", text.slice(0, 400));
    console.log("SET-COOKIE:", cookies.length ? "yes" : "NO COOKIE SET");
  } catch (error) {
    console.log(`\n[${label}] FETCH ERROR: ${error.message}`);
  }
}

await login(
  "admin (no explicit origin header)",
  "admin@loveliberia.com",
  "DemoPassword123!",
);
