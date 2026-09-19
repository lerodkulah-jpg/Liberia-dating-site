import fs from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function isAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;
    const photoId = new URL(request.url).searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required." },
        { status: 400 }
      );
    }

    if (photoId === "profileImage") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, profileImage: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: null },
      });

      if (user.profileImage) {
        await fs
          .unlink(path.join(process.cwd(), "public", user.profileImage.replace(/^\//, "")))
          .catch(() => undefined);
      }

      return NextResponse.json({ success: true });
    }

    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    await prisma.profilePhoto.delete({ where: { id: photo.id } });
    await fs
      .unlink(path.join(process.cwd(), "public", photo.url.replace(/^\//, "")))
      .catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin photo moderation error:", error);
    return NextResponse.json(
      { error: "Unable to remove photo." },
      { status: 500 }
    );
  }
}