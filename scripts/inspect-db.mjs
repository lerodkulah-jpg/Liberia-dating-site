import fs from "node:fs";

const buffer = fs.readFileSync("prisma/dev.db");
const text = buffer.toString("latin1");
const tables = [...text.matchAll(/CREATE TABLE ["`]?([\w]+)["`]?/g)].map(
  (m) => m[1],
);
console.log("TABLES:", tables.join(", ") || "(none found)");

const userTable = text.match(/CREATE TABLE ["`]?User["`]? \(([^)]*)\)/);
if (userTable) {
  console.log("\nUSER COLUMNS:");
  console.log(
    userTable[1]
      .split(",")
      .map((c) => c.trim())
      .join("\n"),
  );
} else {
  console.log("\n(no User table found)");
}
