import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const privacyFields = ["hideOnlineStatus", "hideLastActive", "incognitoMode", "profileViewTracking"] as const;

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hideOnlineStatus: true, hideLastActive: true, messagePermission: true, incognitoMode: true, profileViewTracking: true },
  });
  return user ? NextResponse.json({ privacy: user }) : NextResponse.json({ error: "User not found." }, { status: 404 });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const body = await request.json();
  const data: Record<string, boolean | string> = {};
  for (const field of privacyFields) if (typeof body[field] === "boolean") data[field] = body[field];
  if (body.messagePermission === "EVERYONE" || body.messagePermission === "MATCHES") data.messagePermission = body.messagePermission;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No privacy changes supplied." }, { status: 400 });

  const user = await prisma.user.update({ where: { id: userId }, data, select: { hideOnlineStatus: true, hideLastActive: true, messagePermission: true, incognitoMode: true, profileViewTracking: true } });
  return NextResponse.json({ privacy: user });
}