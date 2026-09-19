import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function currentUser() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId, isActive: true, isBanned: false }, select: { id: true, role: true, firstName: true, username: true, email: true } });
}
