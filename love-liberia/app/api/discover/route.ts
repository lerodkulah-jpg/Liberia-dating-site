import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        sentLikes: { select: { receiverId: true } },
        receivedLikes: { select: { senderId: true } },
        sentMessages: { select: { receiverId: true } },
        receivedMessages: { select: { senderId: true } },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const county = searchParams.get("county");
    const city = searchParams.get("city");
    const relationshipGoal = searchParams.get("relationshipGoal");
    const online = searchParams.get("online") === "true";
    const verified = searchParams.get("verified") === "true";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(24, Math.max(6, Number.parseInt(searchParams.get("limit") || "18", 10) || 18));

    const usersWithNext = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        incognitoMode: false,
        ...(county ? { county } : {}),
        ...(city ? { city: { contains: city } } : {}),
        ...(relationshipGoal ? { relationshipGoal } : {}),
        ...(online ? { isOnline: true } : {}),
        ...(verified ? { verified: true } : {}),
        blocksReceived: {
          none: { blockerId: userId },
        },
        blocksMade: {
          none: { blockedId: userId },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        interests: true,
        relationshipGoal: true,
        id: true,
        firstName: true,
        username: true,
        gender: true,
        country: true,
        dateOfBirth: true,
        county: true,
        city: true,
        bio: true,
        occupation: true,
        education: true,
        languages: true,
        hobbies: true,
        smokingPreference: true,
        drinkingPreference: true,
        childrenPreference: true,
        profileImage: true,
        profilePhotos: {
          select: { id: true, url: true },
          orderBy: { createdAt: "asc" },
        },
        verified: true,
        isOnline: true,
        hideOnlineStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit + 1,
    });
    const hasMore = usersWithNext.length > limit;
    const users = usersWithNext.slice(0, limit);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const [dailyLikes, dailySuperLikes] = await Promise.all([
      prisma.like.count({ where: { senderId: userId, createdAt: { gte: dayStart }, isSuperLike: false } }),
      prisma.like.count({ where: { senderId: userId, createdAt: { gte: dayStart }, isSuperLike: true } }),
    ]);
    const currentInterests = new Set((currentUser.interests || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
    const likedByCurrentUser = new Set(currentUser.sentLikes.map((like) => like.receiverId));
    const likedCurrentUser = new Set(currentUser.receivedLikes.map((like) => like.senderId));
    const interactedWith = new Set([
      ...likedByCurrentUser,
      ...likedCurrentUser,
      ...currentUser.sentMessages.map((message) => message.receiverId),
      ...currentUser.receivedMessages.map((message) => message.senderId),
    ]);
    const genderPreferenceMatches = (gender: string) =>
      !currentUser.preferences ||
      currentUser.preferences.interestedIn === "Everyone" ||
      (currentUser.preferences.interestedIn === "Men" && gender === "Man") ||
      (currentUser.preferences.interestedIn === "Women" && gender === "Woman");
    const today = new Date();
    const profiles = users
      .map((user) => {
        const birthDate = new Date(user.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();

        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        const mutualInterests = (user.interests || "").split(",").map((item) => item.trim()).filter((item) => currentInterests.has(item.toLowerCase()));
        const inAgeRange = !currentUser.preferences || (age >= currentUser.preferences.minAge && age <= currentUser.preferences.maxAge);
        const sameLifestyle = [
          currentUser.smokingPreference && currentUser.smokingPreference === user.smokingPreference,
          currentUser.drinkingPreference && currentUser.drinkingPreference === user.drinkingPreference,
          currentUser.childrenPreference && currentUser.childrenPreference === user.childrenPreference,
        ].filter(Boolean).length;
        const sharedLanguages = (currentUser.languages || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean).some((language) => (user.languages || "").toLowerCase().includes(language));
        const activityLevel = user.isOnline ? 100 : Math.max(0, 100 - Math.floor((Date.now() - user.updatedAt.getTime()) / 86400000) * 15);
        const score =
          (user.city && currentUser.city === user.city ? 12 : user.county && currentUser.county === user.county ? 8 : 0) +
          (inAgeRange ? 12 : 0) +
          (genderPreferenceMatches(user.gender) ? 12 : 0) +
          (currentUser.relationshipGoal && currentUser.relationshipGoal === user.relationshipGoal ? 12 : 0) +
          Math.min(20, mutualInterests.length * 5) +
          (currentUser.hobbies && user.hobbies && currentUser.hobbies.toLowerCase().split(",").some((hobby) => user.hobbies?.toLowerCase().includes(hobby.trim())) ? 8 : 0) +
          sameLifestyle * 3 +
          (currentUser.education && currentUser.education === user.education ? 4 : 0) +
          (sharedLanguages ? 4 : 0) +
          (likedCurrentUser.has(user.id) ? 6 : 0) +
          (interactedWith.has(user.id) ? 3 : 0) +
          Math.round(activityLevel * 0.05);
        return {
          ...user,
          age,
          locationLabel: [user.county, user.country].filter(Boolean).join(", ") || "Liberia",
          mutualInterests,
          compatibilityScore: Math.min(100, score),
          activityLevel,
          isOnline: user.hideOnlineStatus ? false : user.isOnline,
          city: null,
          likedCurrentUser: likedCurrentUser.has(user.id),
          interactedBefore: interactedWith.has(user.id),
        };
      })
      .filter(
        (profile) =>
          !currentUser.preferences ||
          (profile.age >= currentUser.preferences.minAge &&
            profile.age <= currentUser.preferences.maxAge)
      );

    const byScore = [...profiles].sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const byActivity = [...profiles].sort((a, b) => b.activityLevel - a.activityLevel);
    const byNewest = [...profiles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const sections = {
      topPicks: byScore.slice(0, 8),
      nearYou: profiles.filter((profile) => profile.county && profile.county === currentUser.county).slice(0, 8),
      newMembers: byNewest.slice(0, 8),
      mostCompatible: byScore.slice(0, 8),
      recentlyActive: byActivity.slice(0, 8),
      peopleWhoLikedYou: profiles.filter((profile) => profile.likedCurrentUser).slice(0, 8),
      recommendedForYou: byScore.filter((profile) => !profile.interactedBefore).slice(0, 8),
    };
    const usersForView = sort === "recommended" ? byScore : sort === "online" ? byActivity : profiles;
    return NextResponse.json(
      { users: usersForView, sections, page, hasMore, dailyLikesRemaining: Math.max(0, 50 - dailyLikes), superLikesRemaining: Math.max(0, 5 - dailySuperLikes) },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Unable to load profiles." },
      { status: 500 }
    );
  }
}
