import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const currentUserId = token ? await verifyAuthToken(token) : null;
    const { userId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const [outgoing, incoming] = await Promise.all([
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId: currentUserId, receiverId: userId } } }),
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId: userId, receiverId: currentUserId } } }),
    ]);

    if (!outgoing || !incoming) {
      return NextResponse.json({ error: "You can only view profiles of your matches." }, { status: 403 });
    }

    const [currentUser, user] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          city: true,
          county: true,
          relationshipGoal: true,
          interests: true,
          smokingPreference: true,
          drinkingPreference: true,
          childrenPreference: true,
          sentLikes: { select: { receiverId: true } },
          receivedLikes: { select: { senderId: true } },
        },
      }),
      prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        firstName: true,
        username: true,
        gender: true,
        country: true,
        county: true,
        city: true,
        bio: true,
        relationshipGoal: true,
        occupation: true,
        education: true,
        languages: true,
        interests: true,
        hobbies: true,
        smokingPreference: true,
        drinkingPreference: true,
        childrenPreference: true,
        profileImage: true,
        profilePhotos: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } },
        verified: true,
        isOnline: true,
        hideOnlineStatus: true,
        profileViewTracking: true,
        dateOfBirth: true,
        preferences: { select: { interestedIn: true, minAge: true, maxAge: true } },
        sentLikes: { select: { receiverId: true } },
        receivedLikes: { select: { senderId: true } },
      },
      }),
    ]);

    if (!currentUser || !user) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    if (user.profileViewTracking) {
      const recentView = await prisma.profileView.findFirst({
        where: { viewerId: currentUserId, viewedUserId: userId, createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
      });
      if (!recentView) await prisma.profileView.create({ data: { viewerId: currentUserId, viewedUserId: userId } });
    }

    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;

    const splitValues = (value: string | null) =>
      new Set((value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
    const currentInterests = splitValues(currentUser.interests);
    const mutualInterests = (user.interests || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => currentInterests.has(item.toLowerCase()));
    const compatibleSignals = [
      currentUser.relationshipGoal && currentUser.relationshipGoal === user.relationshipGoal,
      currentUser.city && currentUser.city === user.city,
      currentUser.county && currentUser.county === user.county,
      currentUser.smokingPreference && currentUser.smokingPreference === user.smokingPreference,
      currentUser.drinkingPreference && currentUser.drinkingPreference === user.drinkingPreference,
      currentUser.childrenPreference && currentUser.childrenPreference === user.childrenPreference,
      mutualInterests.length > 0,
    ];
    const compatibilityPercentage = Math.round((compatibleSignals.filter(Boolean).length / compatibleSignals.length) * 100);
    const currentConnections = new Set([
      ...currentUser.sentLikes.map((like) => like.receiverId),
      ...currentUser.receivedLikes.map((like) => like.senderId),
    ]);
    const targetConnections = new Set([
      ...user.sentLikes.map((like) => like.receiverId),
      ...user.receivedLikes.map((like) => like.senderId),
    ]);
    const sharedConnections = [...currentConnections].filter((id) => targetConnections.has(id) && id !== userId && id !== currentUserId).length;

    return NextResponse.json({
      user: {
        ...user,
        age,
        compatibilityPercentage,
        mutualInterests,
        sharedConnections,
        dateOfBirth: undefined,
        isOnline: user.hideOnlineStatus ? false : user.isOnline,
        sentLikes: undefined,
        receivedLikes: undefined,
        profileViewTracking: undefined,
      },
    });
  } catch (error) {
    console.error("Match profile error:", error);
    return NextResponse.json({ error: "Unable to load match profile." }, { status: 500 });
  }
}
