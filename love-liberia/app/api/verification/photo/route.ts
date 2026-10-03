import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { hasImageSignature, rateLimit, sameOrigin } from "@/lib/security/request";

const challengeType = "PHOTO_CHALLENGE";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoBytes = 5 * 1024 * 1024;

function hashChallenge(challenge: string) {
  return crypto.createHash("sha256").update(challenge).digest("hex");
}

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function GET(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const limit = await rateLimit(request, "photo-verification-challenge", 5, 60 * 60_000);
  const accountLimit = await rateLimit(request, `photo-verification-challenge:${userId}`, 5, 60 * 60_000);
  if (!limit.allowed || !accountLimit.allowed) return NextResponse.json({ error: "Too many challenge requests. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.max(limit.retryAfter, accountLimit.retryAfter)) } });

  const challenge = crypto.randomInt(100000, 1000000).toString();
  await prisma.verificationToken.deleteMany({ where: { userId, type: challengeType } });
  await prisma.verificationToken.create({
    data: { userId, type: challengeType, tokenHash: hashChallenge(challenge), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });

  return NextResponse.json({ challenge, expiresInSeconds: 600 }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const limit = await rateLimit(request, "photo-verification-submit", 3, 24 * 60 * 60_000);
    const accountLimit = await rateLimit(request, `photo-verification-submit:${userId}`, 3, 24 * 60 * 60_000);
    if (!limit.allowed || !accountLimit.allowed) return NextResponse.json({ error: "Too many submissions. Try again tomorrow." }, { status: 429, headers: { "Retry-After": String(Math.max(limit.retryAfter, accountLimit.retryAfter)) } });

    const formData = await request.formData();
    const file = formData.get("photo");
    const challenge = formData.get("challenge");
    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP verification photo." }, { status: 400 });
    }
    if (file.size < 1 || file.size > maxPhotoBytes) return NextResponse.json({ error: "Photo must be smaller than 5MB." }, { status: 413 });
    if (typeof challenge !== "string" || !/^\d{6}$/.test(challenge)) return NextResponse.json({ error: "Request a fresh selfie code before uploading." }, { status: 400 });

    const savedChallenge = await prisma.verificationToken.findFirst({
      where: { userId, type: challengeType, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    const suppliedHash = Buffer.from(hashChallenge(challenge));
    const savedHash = Buffer.from(savedChallenge?.tokenHash ?? "");
    if (!savedChallenge || savedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(savedHash, suppliedHash)) {
      return NextResponse.json({ error: "That selfie code is invalid or expired. Request a new one." }, { status: 400 });
    }

    const usedChallenge = await prisma.verificationToken.updateMany({
      where: { id: savedChallenge.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (usedChallenge.count !== 1) return NextResponse.json({ error: "That selfie code has already been used." }, { status: 409 });

    const imageData = new Uint8Array(await file.arrayBuffer());
    if (!hasImageSignature(imageData, file.type)) return NextResponse.json({ error: "The uploaded file is not a valid image." }, { status: 400 });

    await prisma.$transaction(async (transaction) => {
      await transaction.verification.updateMany({
        where: { userId, type: "PHOTO", status: "PENDING" },
        data: { status: "SUPERSEDED", verifiedAt: new Date(), photoData: null, photoMimeType: null },
      });
      await transaction.verification.create({
        data: { userId, type: "PHOTO", status: "PENDING", photoData: imageData, photoMimeType: file.type },
      });
      await transaction.user.update({
        where: { id: userId },
        data: { photoVerified: false, photoVerificationStatus: "PENDING", verified: false },
      });
    });

    return NextResponse.json({ message: "Selfie submitted for private review.", status: "PENDING" });
  } catch (error) {
    console.error("Photo verification error:", error);
    return NextResponse.json({ error: "Unable to submit photo verification." }, { status: 500 });
  }
}
