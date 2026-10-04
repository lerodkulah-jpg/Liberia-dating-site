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
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
      },
    });

    const latestMessages = new Map<string, (typeof messages)[number]>();

    for (const message of messages) {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;

      if (!latestMessages.has(otherUserId)) {
        latestMessages.set(otherUserId, message);
      }
    }

    const otherUserIds = Array.from(latestMessages.keys());
    const [users, unreadMessages] = await prisma.$transaction([
      prisma.user.findMany({
        where: { id: { in: otherUserIds } },
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
      prisma.message.groupBy({
        by: ["senderId"],
        where: {
          senderId: { in: otherUserIds },
          receiverId: userId,
          read: false,
        },
        _count: { _all: true },
      }),
    ]);

    const usersById = new Map(users.map((user) => [user.id, user]));
    const unreadCountsByUserId = new Map(
      unreadMessages.map((message) => [message.senderId, message._count._all])
    );
    const conversations = Array.from(latestMessages.entries()).map(
      ([otherUserId, message]) => {
        const user = usersById.get(otherUserId);
        if (!user) return null;

        return {
          user: {
            ...user,
            isOnline: user.hideOnlineStatus ? false : user.isOnline,
            hideOnlineStatus: undefined,
          },
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
          },
          unreadCount: unreadCountsByUserId.get(otherUserId) ?? 0,
        };
      }
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
