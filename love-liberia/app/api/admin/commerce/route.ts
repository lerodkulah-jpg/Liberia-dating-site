import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

async function getAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  return user && can(user.role, "manage_gifts") ? user : null;
}

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Commerce management permission required." }, { status: 403 });
  const [transactions, gifts, subscriptions] = await Promise.all([
    prisma.creditTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.virtualGift.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({ where: { membershipPlan: { in: ["PREMIUM", "VIP"] } }, select: { id: true, firstName: true, username: true, membershipPlan: true, membershipStatus: true } }),
  ]);
  return NextResponse.json({ transactions, gifts, subscriptions });
}

export async function PATCH(request: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Commerce management permission required." }, { status: 403 });
  const { userId, credits, membershipPlan, membershipStatus } = await request.json();
  if (typeof userId !== "string") return NextResponse.json({ error: "userId is required." }, { status: 400 });
  if (typeof membershipPlan === "string") {
    if (!["FREE", "PREMIUM", "VIP"].includes(membershipPlan)) return NextResponse.json({ error: "Invalid membership plan." }, { status: 400 });
    const user = await prisma.user.update({ where: { id: userId }, data: { membershipPlan, membershipStatus: membershipStatus === "CANCELLED" ? "CANCELLED" : "ACTIVE" }, select: { id: true, membershipPlan: true, membershipStatus: true } });
    return NextResponse.json({ user });
  }
  if (typeof credits !== "number" || !Number.isInteger(credits) || credits === 0) return NextResponse.json({ error: "credits must be a non-zero integer." }, { status: 400 });
  const wallet = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.creditWallet.upsert({ where: { userId }, update: { balance: { increment: credits } }, create: { userId, balance: Math.max(0, credits) } });
    await transaction.creditTransaction.create({ data: { userId, type: credits > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT", credits, amountCents: 0, status: "COMPLETED" } });
    return updated;
  });
  return NextResponse.json({ wallet });
}
