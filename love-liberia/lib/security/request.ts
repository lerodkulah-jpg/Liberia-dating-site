import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function getRequestContext(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent") || null,
  };
}

/**
 * Builds an absolute URL the browser can actually navigate to.
 *
 * request.url is NOT safe for this: when the dev server binds 0.0.0.0 (see the
 * "dev" script in package.json) request.url becomes http://0.0.0.0:3000, and
 * 0.0.0.0 is a bind-all address that browsers cannot open. Redirecting a member
 * there silently does nothing, which is why checkout appeared to be broken.
 *
 * Preference order: the configured public app URL, then the Host header the
 * browser actually used, then request.url as a last resort.
 */
export function publicUrl(request: Request, path: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) {
    try {
      return new URL(path, configured).toString();
    } catch {
      // Fall through to the Host header below.
    }
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    try {
      const protocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
      return new URL(path, `${protocol}://${host}`).toString();
    } catch {
      // Fall through to request.url below.
    }
  }

  return new URL(path, request.url).toString();
}

export async function rateLimit(request: Request, key: string, limit = 20, windowMs = 60_000) {
  const context = getRequestContext(request);
  const id = createHash("sha256").update(`${key}:${context.ipAddress || "unknown"}`).digest("hex");
  const now = new Date();
  const resetAt = new Date(Date.now() + windowMs);
  const bucket = await prisma.rateLimitBucket.upsert({ where: { id }, update: {}, create: { id, count: 0, resetAt } });
  const current = bucket.resetAt <= now ? await prisma.rateLimitBucket.update({ where: { id }, data: { count: 1, resetAt } }) : await prisma.rateLimitBucket.update({ where: { id }, data: { count: { increment: 1 } } });
  return { allowed: current.count <= limit, retryAfter: Math.max(0, Math.ceil((current.resetAt.getTime() - Date.now()) / 1000)) };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestUrl = new URL(request.url);
  const allowed = new Set<string>();

  try {
    allowed.add(requestUrl.origin);
  } catch {
    // Ignore malformed request URLs and fall back to the configured origins below.
  }

  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    if (!value) continue;
    try {
      allowed.add(new URL(value).origin);
    } catch {
      // Ignore values that are not valid absolute URLs.
    }
  }

  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  for (const candidate of [host, forwardedHost]) {
    const value = candidate?.split(",")[0]?.trim();
    if (!value) continue;
    try {
      allowed.add(new URL(`${requestUrl.protocol}//${value}`).origin);
    } catch {
      // Ignore malformed host headers.
    }
  }

  if (allowed.has(origin)) return true;

  function isPrivateNetworkHost(hostname: string) {
    const clean = hostname.replace(/\[|\]/g, "").replace(/:\d+$/, "").toLowerCase();
    if (clean === "localhost" || clean === "127.0.0.1" || clean === "::1") return true;

    const parts = clean.split(".");
    if (parts.length !== 4 || !parts.every((part) => /^\d+$/.test(part))) return false;

    const [first, second] = parts.map(Number);
    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    return false;
  }

  try {
    const originHost = new URL(origin).hostname;
    if (isPrivateNetworkHost(originHost)) return true;
  } catch {
    // Ignore malformed origins from mobile browsers or proxies.
  }

  return false;
}

export function validateText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function writeSecurityAudit(request: Request, data: { actorUserId?: string; action: string; targetUserId?: string; metadata?: Record<string, unknown> }) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const context = getRequestContext(request);
    await prisma.securityAuditLog.create({ data: { actorUserId: data.actorUserId, action: data.action, targetUserId: data.targetUserId, ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: data.metadata ? JSON.stringify(data.metadata) : null } });
  } catch (error) {
    console.error("Security audit write error:", error);
  }
}