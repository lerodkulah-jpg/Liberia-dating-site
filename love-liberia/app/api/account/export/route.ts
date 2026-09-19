import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, omit: { password: true }, include: { preferences: true, profilePhotos: true, sentLikes: true, receivedLikes: true, sentMessages: true, receivedMessages: true, blocksMade: true, blocksReceived: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), user }, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="love-liberia-data-${user.username}.json"` } });
}