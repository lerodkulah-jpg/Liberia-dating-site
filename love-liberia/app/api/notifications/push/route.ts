import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  const subscription = body.subscription;
  if (!subscription || typeof subscription.endpoint !== "string" || typeof subscription.keys?.p256dh !== "string" || typeof subscription.keys?.auth !== "string") return NextResponse.json({ error: "A valid push subscription is required." }, { status: 400 });
  const saved = await prisma.pushSubscription.upsert({ where: { endpoint: subscription.endpoint }, update: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }, create: { userId: user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } });
  return NextResponse.json({ subscription: { id: saved.id, endpoint: saved.endpoint } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.endpoint !== "string") return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint: body.endpoint } });
  return NextResponse.json({ success: true });
}