import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { hasImageSignature, rateLimit, sameOrigin, writeSecurityAudit } from "@/lib/security/request";
import { invalidatePhotoVerification } from "@/lib/profile-verification";
import { deleteProfilePhotoObject, ProfilePhotoStorageConfigurationError, uploadProfilePhotoObject } from "@/lib/profile-photo-storage";

export async function POST(request: Request) {
  let uploadedPhotoKey: string | null = null;
  let ownerId: string | null = null;
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const limit = await rateLimit(request, "profile-photo", 12, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many photo changes. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    ownerId = userId;

    const formData = await request.formData();
    const file = formData.get("photo");
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please select a photo." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG and WEBP images are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be smaller than 5MB." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasImageSignature(bytes, file.type)) return NextResponse.json({ error: "The uploaded file is not a valid image." }, { status: 400 });
    const photoKey = randomUUID();
    uploadedPhotoKey = photoKey;
    const imageUrl = `/api/profile-photos/${photoKey}`;
    await uploadProfilePhotoObject(userId, photoKey, bytes, file.type);
    const user = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl },
        select: { id: true, firstName: true, profileImage: true },
      });
      await invalidatePhotoVerification(transaction, userId);
      return updatedUser;
    });

    await writeSecurityAudit(request, { action: "PROFILE_PHOTO_UPLOADED", actorUserId: userId });

    return NextResponse.json({ message: "Profile photo uploaded successfully.", user });
  } catch (error) {
    if (uploadedPhotoKey && ownerId) {
      try {
        await deleteProfilePhotoObject(ownerId, `/api/profile-photos/${uploadedPhotoKey}`);
      } catch (cleanupError) {
        console.error("Profile photo upload cleanup error:", cleanupError);
      }
    }
    console.error("Photo upload error:", error);
    if (error instanceof ProfilePhotoStorageConfigurationError) {
      return NextResponse.json({ error: "Profile photo storage is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to upload profile photo." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (!user?.profileImage) {
      return NextResponse.json({ error: "No main profile photo found." }, { status: 404 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: { profileImage: null } });
      await invalidatePhotoVerification(transaction, userId);
    });

    await deleteProfilePhotoObject(userId, user.profileImage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Main profile photo delete error:", error);
    return NextResponse.json({ error: "Unable to remove main profile photo." }, { status: 500 });
  }
}
