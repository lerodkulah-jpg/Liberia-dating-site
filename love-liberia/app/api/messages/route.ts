import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { assessAccountRisk, evaluateMessageRisk } from "@/lib/security/risk-scoring";

async function getCurrentUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const otherUserId = new URL(request.url).searchParams.get("userId");
    if (!otherUserId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(100, Math.max(20, Number.parseInt(searchParams.get("limit") || "50", 10) || 50));
    const before = searchParams.get("before");

    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          {
            blockerId: userId,
            blockedId: otherUserId,
          },
          {
            blockerId: otherUserId,
            blockedId: userId,
          },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json(
        {
          error: "You cannot view messages with this user.",
        },
        { status: 403 }
      );
    }

    const [sentLike, receivedLike, recipient] = await Promise.all([
      prisma.like.findUnique({
        where: { senderId_receiverId: { senderId: userId, receiverId: otherUserId } },
      }),
      prisma.like.findUnique({
        where: { senderId_receiverId: { senderId: otherUserId, receiverId: userId } },
      }),
      prisma.user.findUnique({ where: { id: otherUserId }, select: { messagePermission: true } }),
    ]);

    if (!recipient || (recipient.messagePermission === "MATCHES" && (!sentLike || !receivedLike))) {
      return NextResponse.json(
        { error: "You can only message someone you have matched with." },
        { status: 403 }
      );
    }

    const [messages, user] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
          ...(before ? { createdAt: { lt: new Date(before) } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      }),
      prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          firstName: true,
          username: true,
          profileImage: true,
          profilePhotos: {
            select: { id: true, url: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          isOnline: true,
        },
      }),
    ]);

    const hasMore = messages.length > limit;
    const visibleMessages = messages.slice(0, limit).reverse();

    await prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ currentUserId: userId, user, messages: visibleMessages, hasMore }, { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" } });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    // Check whether either user has blocked the other
    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          {
            blockerId: userId,
            blockedId: receiverId,
          },
          {
            blockerId: receiverId,
            blockedId: userId,
          },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json(
        {
          error: "You cannot message this user because a block is active.",
        },
        { status: 403 }
      );
    }

    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!receiverId || !trimmedContent) {
      return NextResponse.json(
        { error: "Receiver and message are required." },
        { status: 400 }
      );
    }

    if (userId === receiverId) {
      return NextResponse.json(
        { error: "You cannot message yourself." },
        { status: 400 }
      );
    }

    const [sentLike, receivedLike, recipient] = await Promise.all([
      prisma.like.findUnique({
        where: { senderId_receiverId: { senderId: userId, receiverId } },
      }),
      prisma.like.findUnique({
        where: { senderId_receiverId: { senderId: receiverId, receiverId: userId } },
      }),
      prisma.user.findUnique({ where: { id: receiverId }, select: { messagePermission: true } }),
    ]);

    if (!recipient || (recipient.messagePermission === "MATCHES" && (!sentLike || !receivedLike))) {
      return NextResponse.json(
        { error: "You can only message your matches." },
        { status: 403 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessages = await prisma.message.findMany({
      where: { senderId: userId, createdAt: { gte: oneHourAgo } },
      select: { content: true, receiverId: true },
    });

    const riskAssessment = evaluateMessageRisk({
      content: trimmedContent,
      recentMessageCount: recentMessages.length,
      recentUniqueRecipients: new Set(recentMessages.map((item) => item.receiverId)).size,
      repeatedMessages: recentMessages.filter((item) => item.content.toLowerCase() === trimmedContent.toLowerCase()).length,
    });

    if (riskAssessment.requiresHumanReview) {
      const riskFlagClient = (prisma as any).userRiskFlag;
      if (riskFlagClient?.create) {
        await riskFlagClient.create({
          data: {
            userId,
            source: "MESSAGE_ACTIVITY",
            score: riskAssessment.score,
            level: riskAssessment.level,
            reasons: riskAssessment.reasons.join(", ") || "No major signals",
            notes: assessAccountRisk(riskAssessment, "MESSAGE_ACTIVITY").notes,
            status: "PENDING_REVIEW",
          },
        });
      }
    }

    const message = await prisma.message.create({
      data: { senderId: userId, receiverId, content: trimmedContent },
    });

    return NextResponse.json({ message, risk: riskAssessment.requiresHumanReview ? assessAccountRisk(riskAssessment, "MESSAGE_ACTIVITY") : null }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
