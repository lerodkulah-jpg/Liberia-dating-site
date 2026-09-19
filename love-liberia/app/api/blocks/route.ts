import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getCurrentUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return Response.json({ error: "You must be logged in." }, { status: 401 });

    const { blockedId } = await request.json();
    if (!blockedId) return Response.json({ error: "blockedId is required." }, { status: 400 });
    if (blockedId === currentUserId) return Response.json({ error: "You cannot block yourself." }, { status: 400 });

    const blockedUser = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true, firstName: true } });
    if (!blockedUser) return Response.json({ error: "User not found." }, { status: 404 });

    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId } },
    });
    if (existingBlock) return Response.json({ error: "You have already blocked this user." }, { status: 409 });

    await prisma.block.create({ data: { blockerId: currentUserId, blockedId } });
    return Response.json({ message: `${blockedUser.firstName} has been blocked.`, blockedId });
  } catch (error) {
    console.error("Block user error:", error);
    return Response.json({ error: "Unable to block user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return Response.json({ error: "You must be logged in." }, { status: 401 });

    const { blockedId } = await request.json();
    if (!blockedId) return Response.json({ error: "blockedId is required." }, { status: 400 });

    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId } },
    });
    if (!existingBlock) return Response.json({ error: "This user is not blocked." }, { status: 404 });

    await prisma.block.delete({ where: { id: existingBlock.id } });
    return Response.json({ message: "User has been unblocked.", blockedId });
  } catch (error) {
    console.error("Unblock user error:", error);
    return Response.json({ error: "Unable to unblock user." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return Response.json({ error: "You must be logged in." }, { status: 401 });

    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId) {
      const blocks = await prisma.block.findMany({
        where: { blockerId: currentUserId },
        orderBy: { createdAt: "desc" },
        include: { blocked: { select: { id: true, firstName: true, username: true, profileImage: true } } },
      });
      return Response.json({ blocks });
    }

    const block = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: userId } },
    });
    return Response.json({ blocked: Boolean(block) });
  } catch (error) {
    console.error("Check block status error:", error);
    return Response.json({ error: "Unable to check block status." }, { status: 500 });
  }
}