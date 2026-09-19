import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "admin@loveliberia.com";
const NEW_PASSWORD = "Admin123!";

const hash = await bcrypt.hash(NEW_PASSWORD, 12);

const affected = await prisma.$executeRawUnsafe(
  "UPDATE User SET password = ?, failedLoginCount = 0, lockedUntil = NULL, role = 'ADMIN', isActive = 1, isBanned = 0 WHERE email = ?",
  hash,
  EMAIL,
);

console.log(`Rows updated: ${affected}`);

const check = await prisma.$queryRawUnsafe(
  "SELECT email, role, isActive, failedLoginCount, lockedUntil FROM User WHERE email = ?",
  EMAIL,
);
console.table(check);

console.log(`\nAdmin credentials set to: ${EMAIL} / ${NEW_PASSWORD}`);

await prisma.$disconnect();
