import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function userId() { const token = (await cookies()).get("love_liberia_token")?.value; return token ? verifyAuthToken(token) : null; }

export async function GET() {
  const currentUserId = await userId();
  if (!currentUserId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const favorites = await prisma.favorite.findMany({ where: { userId: currentUserId }, select: { favoriteUserId: true } });
  return NextResponse.json({ favoriteUserIds: favorites.map((favorite) => favorite.favoriteUserId) });
}

export async function POST(request: Request) {
  const currentUserId = await userId();
  if (!currentUserId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.favoriteUserId !== "string" || body.favoriteUserId === currentUserId) return NextResponse.json({ error: "A valid profile is required." }, { status: 400 });
  await prisma.favorite.upsert({ where: { userId_favoriteUserId: { userId: currentUserId, favoriteUserId: body.favoriteUserId } }, update: {}, create: { userId: currentUserId, favoriteUserId: body.favoriteUserId } });
  return NextResponse.json({ favorite: true });
}

export async function DELETE(request: Request) {
  const currentUserId = await userId();
  if (!currentUserId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const favoriteUserId = new URL(request.url).searchParams.get("userId");
  if (!favoriteUserId) return NextResponse.json({ error: "Profile is required." }, { status: 400 });
  await prisma.favorite.deleteMany({ where: { userId: currentUserId, favoriteUserId } });
  return NextResponse.json({ favorite: false });
}