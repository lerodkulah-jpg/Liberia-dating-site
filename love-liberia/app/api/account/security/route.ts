import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { sameOrigin, writeSecurityAudit } from "@/lib/security/request";

async function identity() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, password: true } });
  return user ? { user, token } : null;
}

function sessionIdFromToken(token: string) {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")).sid as string; } catch { return null; }
}

export async function GET() {
  const current = await identity();
  if (!current) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const sessions = await prisma.session.findMany({ where: { userId: current.user.id, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastActiveAt: "desc" }, select: { tokenVersion: true, ipAddress: true, userAgent: true, createdAt: true, lastActiveAt: true, expiresAt: true } });
  const currentSession = current.token ? sessionIdFromToken(current.token) : null;
  return NextResponse.json({
    twoFactorEnabled: false,
    sessions: sessions.map((session) => ({
      ...session,
      current: session.tokenVersion === currentSession,
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const current = await identity();
  if (!current) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (body.action === "change-password") {
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" || body.newPassword.length < 8 || body.newPassword.length > 200) return NextResponse.json({ error: "A valid current and new password are required." }, { status: 400 });
    if (!(await comparePassword(body.currentPassword, current.user.password))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    await prisma.user.update({ where: { id: current.user.id }, data: { password: await hashPassword(body.newPassword) } });
    await prisma.session.updateMany({ where: { userId: current.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await writeSecurityAudit(request, { action: "PASSWORD_CHANGED", actorUserId: current.user.id });
    const response = NextResponse.json({ success: true }); response.cookies.delete("love_liberia_token"); return response;
  }
  if (body.action === "two-factor") {
    return NextResponse.json({ error: "Two-factor authentication is not available." }, { status: 501 });
  }
  if (body.action === "revoke-session" && typeof body.tokenVersion === "string") {
    await prisma.session.updateMany({ where: { userId: current.user.id, tokenVersion: body.tokenVersion, revokedAt: null }, data: { revokedAt: new Date() } });
    return NextResponse.json({ success: true });
  }
  if (body.action === "logout-all") {
    await prisma.session.updateMany({ where: { userId: current.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    const response = NextResponse.json({ success: true }); response.cookies.delete("love_liberia_token"); return response;
  }
  return NextResponse.json({ error: "Unknown security action." }, { status: 400 });
}
