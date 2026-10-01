import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { rateLimit, sameOrigin, writeSecurityAudit } from "@/lib/security/request";

const resetType = "PASSWORD_RESET";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const limit = await rateLimit(request, "password-reset-complete", 10, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });

  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must contain at least 8 characters." }, { status: 400 });
    if (password.length > 200) return NextResponse.json({ error: "Password is too long." }, { status: 400 });

    const resetToken = await prisma.verificationToken.findFirst({
      where: { type: resetType, tokenHash: hashToken(token), usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!resetToken) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.verificationToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: passwordHash, failedLoginCount: 0, lockedUntil: null } }),
      prisma.session.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await writeSecurityAudit(request, { action: "PASSWORD_RESET", actorUserId: resetToken.userId });

    return NextResponse.json({ message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Unable to reset your password." }, { status: 500 });
  }
}
