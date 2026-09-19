import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const notifications = await prisma.notification.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  const where = body.notificationId ? { id: body.notificationId, userId: user.id } : { userId: user.id };
  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ success: true });
}
