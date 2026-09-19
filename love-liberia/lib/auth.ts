import { createHmac, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

export async function createAuthToken(userId: string, context?: { ipAddress?: string | null; userAgent?: string | null }) {
  const tokenVersion = randomUUID();
  await prisma.session.create({ data: { userId, tokenVersion, ipAddress: context?.ipAddress, userAgent: context?.userAgent, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({ sub: userId, sid: tokenVersion, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 })
  );
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export async function verifyAuthToken(token: string): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  const parts = token.split(".");

  if (!secret || parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const expectedSignature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const provided = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: unknown; typ?: unknown };
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      sub?: unknown;
      exp?: unknown;
      sid?: unknown;
    };

    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.sid !== "string" ||
      payload.exp <= Date.now() / 1000
    ) {
      return null;
    }

    const session = await prisma.session.findFirst({ where: { tokenVersion: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } });
    if (!session) return null;
    await prisma.session.update({ where: { id: session.id }, data: { lastActiveAt: new Date() } });
    return payload.sub;
  } catch {
    return null;
  }
}
