import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? await verifyAuthToken(token) : null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, firstName: true, username: true, profileImage: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ hiddenProfiles: blocks.map((b) => ({ ...b.blocked, createdAt: b.createdAt })) });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const { hiddenId } = await request.json();
  if (!hiddenId || hiddenId === userId) return NextResponse.json({ error: "A different profile is required." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: hiddenId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  await prisma.block.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: hiddenId } }, update: {}, create: { blockerId: userId, blockedId: hiddenId } });
  return NextResponse.json({ hiddenId });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const { hiddenId } = await request.json();
  await prisma.block.deleteMany({ where: { blockerId: userId, blockedId: hiddenId } });
  return NextResponse.json({ hiddenId });
}
