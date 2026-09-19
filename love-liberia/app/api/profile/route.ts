import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { rateLimit, sameOrigin, validateText, writeSecurityAudit } from "@/lib/security/request";

async function getCurrentUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, profilePhotos: { orderBy: { createdAt: "asc" } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user, preferences: user.preferences });
  } catch (error) {
    console.error("Profile load error:", error);
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const limit = await rateLimit(request, "profile-update", 30, 15 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many profile changes. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      phone,
      county,
      city,
      bio,
      relationshipGoal,
      occupation,
      education,
      height,
      languages,
      interests,
      hobbies,
      religion,
      smokingPreference,
      drinkingPreference,
      childrenPreference,
      hideOnlineStatus,
      hideLastActive,
      messagePermission,
      incognitoMode,
      profileViewTracking,
      interestedIn,
      minAge,
      maxAge,
    } = body;

    if (typeof firstName !== "string" || !firstName.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!validateText(firstName, 80)) return NextResponse.json({ error: "First name is too long." }, { status: 400 });

    const minimumAge = Number(minAge);
    const maximumAge = Number(maxAge);
    if (!Number.isInteger(minimumAge) || !Number.isInteger(maximumAge) || minimumAge < 18 || maximumAge < minimumAge || maximumAge > 100) {
      return NextResponse.json({ error: "Please enter a valid age range." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        county: typeof county === "string" && county.trim() ? county.trim() : null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
        bio: typeof bio === "string" && bio.trim() ? bio.trim() : null,
        relationshipGoal: typeof relationshipGoal === "string" && relationshipGoal.trim() ? relationshipGoal.trim() : null,
        occupation: typeof occupation === "string" && occupation.trim() ? occupation.trim() : null,
        education: typeof education === "string" && education.trim() ? education.trim() : null,
        height: typeof height === "string" && height.trim() ? height.trim() : null,
        languages: typeof languages === "string" && languages.trim() ? languages.trim() : null,
        interests: typeof interests === "string" && interests.trim() ? interests.trim() : null,
        hobbies: typeof hobbies === "string" && hobbies.trim() ? hobbies.trim() : null,
        religion: typeof religion === "string" && religion.trim() ? religion.trim() : null,
        smokingPreference: typeof smokingPreference === "string" && smokingPreference.trim() ? smokingPreference.trim() : null,
        drinkingPreference: typeof drinkingPreference === "string" && drinkingPreference.trim() ? drinkingPreference.trim() : null,
        childrenPreference: typeof childrenPreference === "string" && childrenPreference.trim() ? childrenPreference.trim() : null,
        hideOnlineStatus: hideOnlineStatus === true,
        hideLastActive: hideLastActive === true,
        messagePermission: messagePermission === "MATCHES" ? "MATCHES" : "EVERYONE",
        incognitoMode: incognitoMode === true,
        profileViewTracking: profileViewTracking !== false,
      },
      include: { preferences: true },
    });

    await prisma.datingPreference.upsert({
      where: { userId },
      update: {
        interestedIn: typeof interestedIn === "string" && interestedIn ? interestedIn : "Everyone",
        minAge: minimumAge,
        maxAge: maximumAge,
        county: typeof county === "string" && county.trim() ? county.trim() : null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
      },
      create: {
        userId,
        interestedIn: typeof interestedIn === "string" && interestedIn ? interestedIn : "Everyone",
        minAge: minimumAge,
        maxAge: maximumAge,
        county: typeof county === "string" && county.trim() ? county.trim() : null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
      },
    });

    await writeSecurityAudit(request, { action: "PROFILE_UPDATED", actorUserId: userId });

    return NextResponse.json({ message: "Profile updated successfully.", user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
