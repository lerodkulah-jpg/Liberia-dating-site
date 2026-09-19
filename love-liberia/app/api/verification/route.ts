import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const verificationTypes = new Set(["EMAIL", "PHONE"]);

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      photoVerified: true,
      photoVerificationStatus: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ verification: user });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const { action, type, code } = await request.json();
    if (!verificationTypes.has(type)) return NextResponse.json({ error: "Choose email or phone verification." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true, emailVerified: true, phoneVerified: true } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (type === "EMAIL" && !user.email) return NextResponse.json({ error: "Add an email address before verifying it." }, { status: 400 });
    if (type === "PHONE" && !user.phone) return NextResponse.json({ error: "Add a phone number before verifying it." }, { status: 400 });

    const alreadyVerified = type === "EMAIL" ? user.emailVerified : user.phoneVerified;
    if (alreadyVerified) return NextResponse.json({ message: `${type === "EMAIL" ? "Email" : "Phone"} is already verified.` });

    if (action === "request") {
      const rawToken = crypto.randomInt(100000, 1000000).toString();
      await prisma.verificationToken.deleteMany({ where: { userId, type } });
      await prisma.verificationToken.create({
        data: {
          userId,
          type,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      console.info(`Verification code generated for ${type} user ${userId}.`);
      return NextResponse.json({ message: "A verification code has been sent.", ...(process.env.NODE_ENV !== "production" ? { developmentCode: rawToken } : {}) });
    }

    if (action !== "confirm" || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the six-digit verification code." }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({ where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (!token || !crypto.timingSafeEqual(Buffer.from(token.tokenHash), Buffer.from(hashToken(code)))) {
      return NextResponse.json({ error: "That verification code is invalid or expired." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: userId }, data: type === "EMAIL" ? { emailVerified: true } : { phoneVerified: true } }),
    ]);
    return NextResponse.json({ message: `${type === "EMAIL" ? "Email" : "Phone"} verified successfully.` });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Unable to process verification." }, { status: 500 });
  }
}
