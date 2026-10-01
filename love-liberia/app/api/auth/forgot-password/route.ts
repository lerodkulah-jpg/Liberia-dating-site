import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicUrl, rateLimit, sameOrigin } from "@/lib/security/request";

const resetType = "PASSWORD_RESET";
const genericMessage = "If an account exists for that email, a password reset link has been sent.";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Love Liberia password",
      html: `<p>We received a request to reset your Love Liberia password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });

  return response.ok;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const limit = await rateLimit(request, "password-reset", 5, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ message: genericMessage }, { status: 200 });

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254) return NextResponse.json({ message: genericMessage });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isActive: true } });
    if (!user || !user.isActive) return NextResponse.json({ message: genericMessage });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: resetType } });
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: resetType,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const resetUrl = publicUrl(request, `/reset-password?token=${encodeURIComponent(rawToken)}`);
    const emailSent = await sendResetEmail(user.email, resetUrl);
    if (!emailSent && process.env.NODE_ENV === "production") {
      console.error("Password reset email is not configured or could not be sent.");
      return NextResponse.json({ error: "Password reset email is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json({
      message: genericMessage,
      ...(process.env.NODE_ENV !== "production" ? { developmentResetUrl: resetUrl } : {}),
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Unable to request a password reset." }, { status: 500 });
  }
}
