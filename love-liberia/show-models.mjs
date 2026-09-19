import fs from "node:fs";

const text = fs.readFileSync(
  "node_modules/.prisma/client/schema.prisma",
  "utf8",
);

for (const name of [
  "Subscription",
  "Payment",
  "CreditTransaction",
  "CreditWallet",
]) {
  const match = text.match(
    new RegExp(`model\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  console.log(`\n===== ${name} =====`);
  console.log(match ? match[1].trim() : "(NOT FOUND)");
}
