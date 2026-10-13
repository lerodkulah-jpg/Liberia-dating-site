import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { downloadProfilePhotoObject, ProfilePhotoStorageConfigurationError } from "@/lib/profile-photo-storage";
import { hasImageSignature } from "@/lib/security/request";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoKey: string }> },
) {
  try {
    const { photoKey } = await params;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(photoKey) || photoKey.includes("..")) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const storedUrl = `/api/profile-photos/${photoKey}`;
    const legacyUrl = `/uploads/profiles/${photoKey}`;
    const [primaryOwner, galleryPhoto] = await Promise.all([
      prisma.user.findFirst({
        where: { profileImage: { in: [storedUrl, legacyUrl] } },
        select: { id: true, profileVisibility: true, isActive: true, isBanned: true },
      }),
      prisma.profilePhoto.findFirst({
        where: { url: { in: [storedUrl, legacyUrl] } },
        select: {
          user: { select: { id: true, profileVisibility: true, isActive: true, isBanned: true } },
        },
      }),
    ]);
    const owner = primaryOwner ?? galleryPhoto?.user;
    if (!owner) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const token = (await cookies()).get("love_liberia_token")?.value;
    const viewerId = token ? await verifyAuthToken(token) : null;
    const viewer = viewerId
      ? await prisma.user.findUnique({ where: { id: viewerId }, select: { id: true, role: true, isActive: true, isBanned: true } })
      : null;
    const isOwner = viewerId === owner.id;
    const isModerator = Boolean(viewer && can(viewer.role, "verify_profiles"));

    if (!isOwner && !isModerator && owner.profileVisibility !== "PUBLIC") {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    if ((!owner.isActive || owner.isBanned) && !isOwner && !isModerator) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    if (viewerId && viewerId !== owner.id && !isModerator) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: owner.id },
            { blockerId: owner.id, blockedId: viewerId },
          ],
        },
        select: { id: true },
      });
      if (block) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    if (viewer && (!viewer.isActive || viewer.isBanned)) {
      return NextResponse.json({ error: "You are not allowed to view this photo." }, { status: 403 });
    }

    const photo = await downloadProfilePhotoObject(owner.id, photoKey);
    if (!photo || !hasImageSignature(photo.bytes, photo.contentType)) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    return new NextResponse(photo.bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(photo.bytes.length),
        "Content-Type": photo.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Profile photo retrieval error:", error);
    if (error instanceof ProfilePhotoStorageConfigurationError) {
      return NextResponse.json({ error: "Profile photo storage is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to load this photo." }, { status: 500 });
  }
}
