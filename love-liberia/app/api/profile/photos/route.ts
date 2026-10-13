import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { hasImageSignature, rateLimit, sameOrigin, writeSecurityAudit } from "@/lib/security/request";
import { invalidatePhotoVerification } from "@/lib/profile-verification";
import { deleteProfilePhotoObject, ProfilePhotoStorageConfigurationError, uploadProfilePhotoObject } from "@/lib/profile-photo-storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotos = 10;
const maxFileSize = 5 * 1024 * 1024;

async function getCurrentUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function POST(request: Request) {
  const uploadedPhotoKeys: string[] = [];
  let ownerId: string | null = null;

  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const limit = await rateLimit(request, "gallery-photo", 12, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many photo changes. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    ownerId = userId;

    const count = await prisma.profilePhoto.count({ where: { userId } });
    const files = (await request.formData())
      .getAll("photo")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Please select at least one photo." }, { status: 400 });
    }

    if (count + files.length > maxPhotos) {
      return NextResponse.json(
        { error: `You can add up to ${maxPhotos} additional photos. You have ${maxPhotos - count} slots left.` },
        { status: 400 }
      );
    }

    const validatedFiles: { file: File; bytes: Uint8Array }[] = [];
    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json({ error: "Only JPG, PNG and WEBP images are allowed." }, { status: 400 });
      }
      if (file.size > maxFileSize) {
        return NextResponse.json({ error: "Each photo must be smaller than 5MB." }, { status: 400 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!hasImageSignature(bytes, file.type)) return NextResponse.json({ error: "One of the uploaded files is not a valid image." }, { status: 400 });
      validatedFiles.push({ file, bytes });
    }

    const uploadedPhotos: { url: string }[] = [];
    for (const { file, bytes } of validatedFiles) {
      const photoKey = randomUUID();
      await uploadProfilePhotoObject(userId, photoKey, bytes, file.type);
      uploadedPhotoKeys.push(photoKey);
      uploadedPhotos.push({ url: `/api/profile-photos/${photoKey}` });
    }

    const photos = await prisma.$transaction(async (transaction) => {
      const createdPhotos = [];
      for (const photo of uploadedPhotos) {
        createdPhotos.push(await transaction.profilePhoto.create({
          data: { userId, url: photo.url },
          select: { id: true, url: true, createdAt: true },
        }));
      }
      await invalidatePhotoVerification(transaction, userId);
      return createdPhotos;
    });

    await writeSecurityAudit(request, { action: "GALLERY_PHOTOS_UPLOADED", actorUserId: userId, metadata: { count: photos.length } });

    return NextResponse.json({ photos }, { status: 201 });
  } catch (error) {
    if (ownerId) {
      const cleanupOwnerId = ownerId;
      const cleanupResults = await Promise.allSettled(
        uploadedPhotoKeys.map((photoKey) => deleteProfilePhotoObject(cleanupOwnerId, `/api/profile-photos/${photoKey}`)),
      );
      for (const result of cleanupResults) {
        if (result.status === "rejected") console.error("Gallery photo upload cleanup error:", result.reason);
      }
    }
    console.error("Gallery photo upload error:", error);
    if (error instanceof ProfilePhotoStorageConfigurationError) {
      return NextResponse.json({ error: "Profile photo storage is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to upload photo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const photoId = new URL(request.url).searchParams.get("id");
    if (!photoId) return NextResponse.json({ error: "Photo ID is required." }, { status: 400 });

    const photo = await prisma.profilePhoto.findFirst({ where: { id: photoId, userId } });
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.profilePhoto.delete({ where: { id: photo.id } });
      if (user?.profileImage === photo.url) await transaction.user.update({ where: { id: userId }, data: { profileImage: null } });
      await invalidatePhotoVerification(transaction, userId);
    });
    await deleteProfilePhotoObject(userId, photo.url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery photo delete error:", error);
    return NextResponse.json({ error: "Unable to delete photo." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { photoId } = await request.json();
    if (typeof photoId !== "string") {
      return NextResponse.json({ error: "Photo ID is required." }, { status: 400 });
    }

    const photo = await prisma.profilePhoto.findFirst({ where: { id: photoId, userId } });
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: { profileImage: photo.url } });
      await invalidatePhotoVerification(transaction, userId);
    });

    return NextResponse.json({ profileImage: photo.url });
  } catch (error) {
    console.error("Main profile photo update error:", error);
    return NextResponse.json({ error: "Unable to set main profile photo." }, { status: 500 });
  }
}
