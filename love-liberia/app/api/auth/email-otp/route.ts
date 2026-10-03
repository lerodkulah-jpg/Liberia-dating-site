import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/auth";
import { getRequestContext, rateLimit, sameOrigin, writeSecurityAudit } from "@/lib/security/request";

const tokenType = "EMAIL_LOGIN";
const genericMessage = "If an active account matches that email, a sign-in code will be sent.";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function sendCodeEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM || process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Love Liberia sign-in code",
      text: `Your Love Liberia sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<p>Your Love Liberia sign-in code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });

  return response.ok;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!process.env.AUTH_SECRET) return NextResponse.json({ error: "Sign-in service is temporarily unavailable." }, { status: 503 });

  try {
    const body = await request.json();
    const action = body.action === "request" || body.action === "verify" ? body.action : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code : "";

    if (!action || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (action === "verify" && !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the six-digit sign-in code." }, { status: 400 });
    }

    const limit = await rateLimit(request, `email-otp-${action}`, action === "request" ? 5 : 10, 15 * 60_000);
    const emailLimit = await rateLimit(request, `email-otp-${action}:${email}`, action === "request" ? 3 : 10, 15 * 60_000);
    if (!limit.allowed || !emailLimit.allowed) {
      return NextResponse.json({ error: "Too many code attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.max(limit.retryAfter, emailLimit.retryAfter)) } });
    }

    const from = process.env.AUTH_EMAIL_FROM || process.env.PASSWORD_RESET_FROM_EMAIL;
    if (action === "request" && process.env.NODE_ENV === "production" && (!process.env.RESEND_API_KEY || !from)) {
      return NextResponse.json({ error: "Email sign-in is not configured." }, { status: 503 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isActive: true, lockedUntil: true } });

    if (action === "request") {
      if (!user?.isActive || (user.lockedUntil && user.lockedUntil > new Date())) {
        return NextResponse.json({ success: true, message: genericMessage });
      }

      const rawCode = crypto.randomInt(100000, 1000000).toString();
      await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: tokenType } });
      await prisma.verificationToken.create({
        data: { userId: user.id, type: tokenType, tokenHash: hashCode(rawCode), expiresAt: new Date(Date.now() + 10 * 60_000) },
      });

      if (process.env.RESEND_API_KEY && from) {
        const sent = await sendCodeEmail(user.email, rawCode);
        if (!sent) {
          await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: tokenType } });
          console.error("Email OTP delivery failed.");
          return NextResponse.json({ success: true, message: genericMessage });
        }
      } else if (process.env.NODE_ENV === "production") {
        await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: tokenType } });
        return NextResponse.json({ error: "Email sign-in is not configured." }, { status: 503 });
      }

      return NextResponse.json({
        success: true,
        message: genericMessage,
        ...(process.env.NODE_ENV !== "production" ? { developmentCode: rawCode } : {}),
      });
    }

    if (!user?.isActive || (user.lockedUntil && user.lockedUntil > new Date())) {
      return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: tokenType, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    const suppliedHash = Buffer.from(hashCode(code));
    const savedHash = Buffer.from(token?.tokenHash ?? "");
    if (!token || savedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(savedHash, suppliedHash)) {
      return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });
    }

    const context = getRequestContext(request);
    const now = new Date();
    const authenticated = await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;

      const activeUser = await transaction.user.findFirst({
        where: { id: user.id, isActive: true, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
        select: { id: true },
      });
      if (!activeUser) return false;

      await transaction.user.update({
        where: { id: activeUser.id },
        data: { emailVerified: true, failedLoginCount: 0, lockedUntil: null, lastLoginAt: now, lastLoginIp: context.ipAddress },
      });
      await transaction.loginAttempt.create({ data: { email, success: true, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      return true;
    });

    if (!authenticated) return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });

    await writeSecurityAudit(request, { action: "LOGIN_SUCCESS", actorUserId: user.id, metadata: { method: "email_otp" } });
    const response = NextResponse.json({ success: true, message: "Signed in successfully." });
    response.cookies.set("love_liberia_token", await createAuthToken(user.id, context), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Email OTP sign-in error:", error);
    return NextResponse.json({ error: "Email sign-in is temporarily unavailable." }, { status: 503 });
  }
}