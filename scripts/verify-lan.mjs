const LAN = "10.151.7.119";
const stamp = Date.now();

// Simulates what a real browser on the LAN does: page served from the LAN host,
// and fetch() sends Origin: http://10.151.7.119:3000
try {
  const reg = await fetch(`http://${LAN}:3000/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: `http://${LAN}:3000`,
    },
    body: JSON.stringify({
      firstName: "Lan",
      username: `lan${stamp}`,
      email: `lan${stamp}@example.com`,
      password: "password123",
      dateOfBirth: "1995-05-05",
      gender: "Man",
    }),
  });
  console.log(`LAN register status: ${reg.status}`);
  console.log((await reg.text()).slice(0, 220));
} catch (error) {
  console.log("LAN request failed:", error.message);
}

try {
  const login = await fetch(`http://${LAN}:3000/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: `http://${LAN}:3000`,
    },
    body: JSON.stringify({
      email: "admin@loveliberia.com",
      password: "Admin123!",
    }),
  });
  console.log(`\nLAN admin login status: ${login.status}`);
  console.log((await login.text()).slice(0, 220));
} catch (error) {
  console.log("LAN admin request failed:", error.message);
}
