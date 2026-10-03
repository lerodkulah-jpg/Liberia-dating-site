import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { CHAT_PHOTO_MAX_BYTES, CHAT_PHOTO_TYPES } from "@/lib/chat-photo";
import { hasImageSignature } from "@/lib/security/request";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;
    if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { messageId } = await params;
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, receiverId: true, imageData: true, imageMimeType: true },
    });
    if (!message || (message.senderId !== userId && message.receiverId !== userId)) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    const [block, sentLike, receivedLike, recipient] = await Promise.all([
      prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: otherUserId },
            { blockerId: otherUserId, blockedId: userId },
          ],
        },
      }),
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId: userId, receiverId: otherUserId } } }),
      prisma.like.findUnique({ where: { senderId_receiverId: { senderId: otherUserId, receiverId: userId } } }),
      prisma.user.findUnique({ where: { id: otherUserId }, select: { messagePermission: true } }),
    ]);
    if (block) return NextResponse.json({ error: "You cannot view messages with this user." }, { status: 403 });
    if (!recipient || (recipient.messagePermission === "MATCHES" && (!sentLike || !receivedLike))) {
      return NextResponse.json({ error: "You can only view photos from your matches." }, { status: 403 });
    }

    if (!message.imageData || !message.imageMimeType || !CHAT_PHOTO_TYPES.has(message.imageMimeType)) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const bytes = new Uint8Array(message.imageData);
    if (bytes.length > CHAT_PHOTO_MAX_BYTES || !hasImageSignature(bytes, message.imageMimeType)) {
      return NextResponse.json({ error: "Photo is invalid." }, { status: 404 });
    }

    return new NextResponse(Uint8Array.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(bytes.length),
        "Content-Type": message.imageMimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Get chat photo error:", error);
    return NextResponse.json({ error: "Unable to load photo." }, { status: 500 });
  }
}
