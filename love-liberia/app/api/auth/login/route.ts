import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { createAuthToken } from "@/lib/auth";
import { getRequestContext, rateLimit, sameOrigin, writeSecurityAudit } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
    const limit = await rateLimit(request, "login", 10, 15 * 60_000);
    if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const context = getRequestContext(request);

    if (!email || email.length > 254 || !password || password.length > 200) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      await prisma.loginAttempt.create({ data: { email, success: false, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      return NextResponse.json({ success: false, message: "This account is temporarily locked. Try again later." }, { status: 423 });
    }

    const validPassword = user ? await comparePassword(password, user.password) : false;
    if (!user || !validPassword || !user.isActive) {
      await prisma.loginAttempt.create({ data: { email, success: false, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      if (user) {
        const failedLoginCount = user.failedLoginCount + 1;
        await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount, lockedUntil: failedLoginCount >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
        await writeSecurityAudit(request, { action: "LOGIN_FAILURE", actorUserId: user.id, metadata: { failedLoginCount } });
      } else {
        await writeSecurityAudit(request, { action: "LOGIN_FAILURE", metadata: { email } });
      }
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    await prisma.loginAttempt.create({ data: { email, success: true, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: context.ipAddress } });
    await writeSecurityAudit(request, { action: "LOGIN_SUCCESS", actorUserId: user.id });

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully.",
    });

    response.cookies.set("love_liberia_token", await createAuthToken(user.id, context), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to sign in right now." },
      { status: 500 }
    );
  }
}