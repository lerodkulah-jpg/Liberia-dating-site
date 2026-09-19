import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const stories = await prisma.story.findMany({ where: { deletedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, firstName: true, username: true, profileImage: true } } }, take: 100 });
  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.mediaUrl !== "string" || body.mediaUrl.length > 2048) return NextResponse.json({ error: "A valid media URL is required." }, { status: 400 });
  const story = await prisma.story.create({ data: { userId: user.id, mediaUrl: body.mediaUrl, caption: typeof body.caption === "string" ? body.caption.slice(0, 500) : null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  return NextResponse.json({ story }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const storyId = new URL(request.url).searchParams.get("id");
  if (!storyId) return NextResponse.json({ error: "Story ID is required." }, { status: 400 });
  const story = await prisma.story.updateMany({ where: { id: storyId, userId: user.id, deletedAt: null }, data: { deletedAt: new Date() } });
  return story.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Story not found." }, { status: 404 });
}
