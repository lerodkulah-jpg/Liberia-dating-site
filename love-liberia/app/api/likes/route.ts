import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { assessAccountRisk, evaluateLikeRisk } from "@/lib/security/risk-scoring";
import { FREE_DAILY_LIKE_LIMIT, FREE_DAILY_SUPER_LIKE_LIMIT, hasActivePaidMembership } from "@/lib/billing/plans";
import { sameOrigin } from "@/lib/security/request";
import { spendWalletCredits } from "@/lib/wallet/spend";
import { CREDIT_USAGE_COSTS } from "@/lib/wallet/usage";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const token = (await cookies()).get("love_liberia_token")?.value;
    const senderId = token ? await verifyAuthToken(token) : null;
    if (!senderId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { receiverId, action } = await request.json();
    if (!receiverId) return NextResponse.json({ error: "Receiver ID is required." }, { status: 400 });
    if (senderId === receiverId) return NextResponse.json({ error: "You cannot like yourself." }, { status: 400 });

    const [receiver, sender] = await Promise.all([
      prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, firstName: true, profileImage: true } }),
      prisma.user.findUnique({ where: { id: senderId }, select: { id: true, firstName: true, profileImage: true, membershipPlan: true, membershipStatus: true } }),
    ]);
    if (!receiver) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const existingLike = await prisma.like.findUnique({ where: { senderId_receiverId: { senderId, receiverId } } });
    if (existingLike) return NextResponse.json({ message: "Already liked.", matched: false });

    const isSuperLike = action === "super";
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dailyLikes = await prisma.like.count({ where: { senderId, createdAt: { gte: dayStart }, isSuperLike: false } });
    const dailySuperLikes = await prisma.like.count({ where: { senderId, createdAt: { gte: dayStart }, isSuperLike: true } });
    const hasPaidAccess = await hasActivePaidMembership(senderId);
    if (!hasPaidAccess && !isSuperLike && dailyLikes >= FREE_DAILY_LIKE_LIMIT) return NextResponse.json({ error: `You have used today's ${FREE_DAILY_LIKE_LIMIT} likes. Premium and VIP include unlimited likes.` }, { status: 429 });
    if (!hasPaidAccess && isSuperLike && dailySuperLikes >= FREE_DAILY_SUPER_LIKE_LIMIT) return NextResponse.json({ error: `You have used today's ${FREE_DAILY_SUPER_LIKE_LIMIT} Super Likes. Upgrade for unlimited Super Likes.` }, { status: 429 });

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
      await prisma.userRiskFlag.create({
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

    if (isSuperLike) {
      const created = await prisma.$transaction(async (transaction) => {
        const spent = await spendWalletCredits(transaction, senderId, CREDIT_USAGE_COSTS.SUPER_LIKE, "SUPER_LIKE_USE");
        if (!spent) return false;
        await transaction.like.create({ data: { senderId, receiverId, isSuperLike: true } });
        return true;
      });
      if (!created) return NextResponse.json({ error: `Not enough credits. A Super Like costs ${CREDIT_USAGE_COSTS.SUPER_LIKE} credits.` }, { status: 402 });
    } else {
      await prisma.like.create({ data: { senderId, receiverId, isSuperLike: false } });
    }
    const mutualLike = await prisma.like.findUnique({ where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } } });
    return NextResponse.json({
      message: mutualLike ? "It's a match!" : "Like sent",
      matched: Boolean(mutualLike),
      risk: riskAssessment.requiresHumanReview ? assessAccountRisk(riskAssessment, "LIKE_ACTIVITY") : null,
      matchProfiles: mutualLike ? {
        currentUser: sender ? { id: sender.id, firstName: sender.firstName, profileImage: sender.profileImage } : null,
        otherUser: receiver,
      } : null,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Unable to send like." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const token = (await cookies()).get("love_liberia_token")?.value;
    const senderId = token ? await verifyAuthToken(token) : null;
    const receiverId = new URL(request.url).searchParams.get("receiverId");
    if (!senderId || !receiverId) return NextResponse.json({ error: "Authentication and receiver are required." }, { status: 400 });
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let rewindResult: "REWOUND" | "NOT_FOUND" | "INSUFFICIENT_CREDITS" = "NOT_FOUND";
    try {
      rewindResult = await prisma.$transaction(async (transaction) => {
        const like = await transaction.like.findFirst({ where: { senderId, receiverId, createdAt: { gte: cutoff } }, select: { id: true } });
        if (!like) return "NOT_FOUND";

        const deleted = await transaction.like.deleteMany({ where: { id: like.id } });
        if (!deleted.count) return "NOT_FOUND";

        const spent = await spendWalletCredits(transaction, senderId, CREDIT_USAGE_COSTS.REWIND, "REWIND_USE");
        if (!spent) throw new Error("INSUFFICIENT_CREDITS");
        return "REWOUND";
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") rewindResult = "INSUFFICIENT_CREDITS";
      else throw error;
    }

    if (rewindResult === "INSUFFICIENT_CREDITS") return NextResponse.json({ error: `Not enough credits. A rewind costs ${CREDIT_USAGE_COSTS.REWIND} credit.` }, { status: 402 });
    if (rewindResult === "NOT_FOUND") return NextResponse.json({ error: "No recent like is available to rewind." }, { status: 404 });
    return NextResponse.json({ message: "Last action undone." });
  } catch (error) {
    console.error("Undo like error:", error);
    return NextResponse.json({ error: "Unable to undo the last action." }, { status: 500 });
  }
}
