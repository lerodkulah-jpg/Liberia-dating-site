import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
    });

    const latestMessages = new Map<string, (typeof messages)[number]>();

    for (const message of messages) {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;

      if (!latestMessages.has(otherUserId)) {
        latestMessages.set(otherUserId, message);
      }
    }

    const conversations = await Promise.all(
      Array.from(latestMessages.entries()).map(async ([otherUserId, message]) => {
        const [user, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              firstName: true,
              username: true,
              profileImage: true,
              profilePhotos: {
                select: { id: true, url: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
              isOnline: true,
              hideOnlineStatus: true,
            },
          }),
          prisma.message.count({
            where: {
              senderId: otherUserId,
              receiverId: userId,
              read: false,
            },
          }),
        ]);

        if (!user) {
          return null;
        }

        return {
          user: { ...user, isOnline: user.hideOnlineStatus ? false : user.isOnline, hideOnlineStatus: undefined },
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
          },
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      conversations: conversations.filter(Boolean),
    });
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json(
      { error: "Unable to load conversations." },
      { status: 500 }
    );
  }
}
