import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.passedUserId !== "string" || body.passedUserId === userId) return NextResponse.json({ error: "A valid profile is required." }, { status: 400 });
  await prisma.pass.upsert({ where: { userId_passedUserId: { userId, passedUserId: body.passedUserId } }, update: {}, create: { userId, passedUserId: body.passedUserId } });
  return NextResponse.json({ passed: true });
}
