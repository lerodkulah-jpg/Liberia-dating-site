const payload = {
  firstName: "Test",
  username: `tuser${Date.now()}`,
  email: `tuser${Date.now()}@example.com`,
  password: "password123",
  dateOfBirth: "1995-05-05",
  gender: "Man",
};

async function attempt(label, url, headers) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    console.log(`\n[${label}] STATUS ${response.status}`);
    console.log(text.slice(0, 1200));
  } catch (error) {
    console.log(`\n[${label}] FETCH ERROR: ${error.message}`);
  }
}

await attempt(
  "no-origin-header",
  "http://localhost:3000/api/auth/register",
  {},
);
await attempt("with-origin", "http://localhost:3000/api/auth/register", {
  Origin: "http://localhost:3000",
});
