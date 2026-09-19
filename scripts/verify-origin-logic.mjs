// Verify the sameOrigin logic against real-world combinations without network access.
process.env.NEXT_PUBLIC_APP_URL = "http://10.151.7.119:3000";

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowed = new Set();

  try {
    allowed.add(new URL(request.url).origin);
  } catch {}

  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    if (!value) continue;
    try {
      allowed.add(new URL(value).origin);
    } catch {}
  }

  const host = request.headers.get("host");
  if (host) {
    try {
      allowed.add(new URL(`${new URL(request.url).protocol}//${host}`).origin);
    } catch {}
  }

  return allowed.has(origin);
}

const cases = [
  [
    "browser on localhost:3000",
    "http://localhost:3000/api/auth/register",
    { origin: "http://localhost:3000" },
    true,
  ],
  [
    "browser on LAN IP (the reported bug)",
    "http://localhost:3000/api/auth/register",
    { origin: "http://10.151.7.119:3000" },
    true,
  ],
  [
    "no Origin (native/curl)",
    "http://localhost:3000/api/auth/register",
    {},
    true,
  ],
  [
    "host header matches LAN",
    "http://localhost:3000/api/auth/register",
    { origin: "http://10.151.7.119:3000", host: "10.151.7.119:3000" },
    true,
  ],
  [
    "attacker origin (must be blocked)",
    "http://localhost:3000/api/auth/register",
    { origin: "http://evil.example.com" },
    false,
  ],
  [
    "attacker origin 2 (must be blocked)",
    "http://localhost:3000/api/auth/register",
    { origin: "http://10.151.7.119:9999" },
    false,
  ],
];

let failures = 0;
for (const [label, url, headers, expected] of cases) {
  const request = { url, headers: new Map(Object.entries(headers)) };
  request.headers = { get: (key) => headers[key.toLowerCase()] ?? null };
  const actual = sameOrigin(request);
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${label} -> ${actual} (expected ${expected})`,
  );
}
console.log(
  failures === 0
    ? "\nAll sameOrigin cases behave correctly."
    : `\n${failures} case(s) failed.`,
);
