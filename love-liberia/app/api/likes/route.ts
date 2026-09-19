import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { assessAccountRisk, evaluateLikeRisk } from "@/lib/security/risk-scoring";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const senderId = token ? await verifyAuthToken(token) : null;
    if (!senderId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { receiverId, action } = await request.json();
    if (!receiverId) return NextResponse.json({ error: "Receiver ID is required." }, { status: 400 });
    if (senderId === receiverId) return NextResponse.json({ error: "You cannot like yourself." }, { status: 400 });

    const [receiver, sender] = await Promise.all([
      prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, firstName: true, profileImage: true } }),
      prisma.user.findUnique({ where: { id: senderId }, select: { id: true, firstName: true, profileImage: true } }),
    ]);
    if (!receiver) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const existingLike = await prisma.like.findUnique({ where: { senderId_receiverId: { senderId, receiverId } } });
    if (existingLike) return NextResponse.json({ message: "Already liked.", matched: false });

    const isSuperLike = action === "super";
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dailyLikes = await prisma.like.count({ where: { senderId, createdAt: { gte: dayStart }, isSuperLike: false } });
    const dailySuperLikes = await prisma.like.count({ where: { senderId, createdAt: { gte: dayStart }, isSuperLike: true } });
    if (!isSuperLike && dailyLikes >= 50) return NextResponse.json({ error: "You have used today's 50 likes." }, { status: 429 });
    if (isSuperLike && dailySuperLikes >= 5) return NextResponse.json({ error: "You have used today's 5 Super Likes." }, { status: 429 });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const [likesToday, recentLikes, uniqueLikedProfiles] = await Promise.all([
      prisma.like.count({ where: { senderId, createdAt: { gte: dayStart } } }),
      prisma.like.findMany({ where: { senderId, createdAt: { gte: tenMinutesAgo } }, select: { receiverId: true } }),
      prisma.like.findMany({ where: { senderId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, select: { receiverId: true } }),
    ]);

    const riskAssessment = evaluateLikeRisk({
      likesToday,
      likesInLastTenMinutes: recentLikes.length,
      uniqueProfilesLiked: new Set(uniqueLikedProfiles.map((like) => like.receiverId)).size,
      isSuperLike,
    });

    if (riskAssessment.requiresHumanReview) {
      const riskFlagClient = (prisma as any).userRiskFlag;
      if (riskFlagClient?.create) {
        await riskFlagClient.create({
          data: {
            userId: senderId,
            source: "LIKE_ACTIVITY",
            score: riskAssessment.score,
            level: riskAssessment.level,
            reasons: riskAssessment.reasons.join(", ") || "No major signals",
            notes: assessAccountRisk(riskAssessment, "LIKE_ACTIVITY").notes,
            status: "PENDING_REVIEW",
          },
        });
      }
    }

    await prisma.like.create({ data: { senderId, receiverId, isSuperLike } });
    const mutualLike = await prisma.like.findUnique({ where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } } });
    return NextResponse.json({
      message: mutualLike ? "It's a match!" : "Like sent",
      matched: Boolean(mutualLike),
      risk: riskAssessment.requiresHumanReview ? assessAccountRisk(riskAssessment, "LIKE_ACTIVITY") : null,
      matchProfiles: mutualLike ? { currentUser: sender, otherUser: receiver } : null,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Unable to send like." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const senderId = token ? await verifyAuthToken(token) : null;
    const receiverId = new URL(request.url).searchParams.get("receiverId");
    if (!senderId || !receiverId) return NextResponse.json({ error: "Authentication and receiver are required." }, { status: 400 });
    await prisma.like.deleteMany({ where: { senderId, receiverId } });
    return NextResponse.json({ message: "Last action undone." });
  } catch (error) {
    console.error("Undo like error:", error);
    return NextResponse.json({ error: "Unable to undo the last action." }, { status: 500 });
  }
}
