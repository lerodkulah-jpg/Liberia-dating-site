import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { giftCatalog, type GiftType } from "@/lib/gifts/catalog";

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const gifts = await prisma.virtualGift.findMany({ where: { receiverId: userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ gifts, catalog: giftCatalog });
}

export async function POST(request: Request) {
  const senderId = await getUserId();
  if (!senderId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const { receiverId, giftType } = await request.json();
    if (typeof receiverId !== "string" || !(giftType in giftCatalog)) return NextResponse.json({ error: "Choose a valid gift and recipient." }, { status: 400 });
    if (receiverId === senderId) return NextResponse.json({ error: "You cannot send a gift to yourself." }, { status: 400 });
    const [sentLike, receivedLike] = await Promise.all([
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId, receiverId } } }),
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } } }),
    ]);
    if (!sentLike || !receivedLike) return NextResponse.json({ error: "You can only send gifts to a match." }, { status: 403 });

    const key = giftType as GiftType;
    const gift = giftCatalog[key];
    const result = await prisma.$transaction(async (transaction) => {
      const debit = await transaction.creditWallet.updateMany({ where: { userId: senderId, balance: { gte: gift.credits } }, data: { balance: { decrement: gift.credits } } });
      if (debit.count !== 1) return null;
      const sentGift = await transaction.virtualGift.create({ data: { senderId, receiverId, giftType: key, credits: gift.credits } });
      await transaction.creditTransaction.create({ data: { userId: senderId, type: `GIFT_${key}`, credits: -gift.credits, amountCents: 0, status: "COMPLETED" } });
      return sentGift;
    });
    if (!result) return NextResponse.json({ error: "Not enough credits. Purchase more credits in your wallet." }, { status: 402 });
    return NextResponse.json({ message: `${gift.emoji} ${gift.label} sent!`, gift: result }, { status: 201 });
  } catch (error) {
    console.error("Send gift error:", error);
    return NextResponse.json({ error: "Unable to send gift." }, { status: 500 });
  }
}
