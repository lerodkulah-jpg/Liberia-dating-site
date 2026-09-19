import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { sameOrigin, writeSecurityAudit } from "@/lib/security/request";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });
    try {
      const payload = token ? JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { sid?: string } : {};
      if (payload.sid) await prisma.session.updateMany({ where: { userId, tokenVersion: payload.sid, revokedAt: null }, data: { revokedAt: new Date() } });
    } catch {
      // The cookie is cleared even if an older token has no session id.
    }
    await writeSecurityAudit(request, { action: "LOGOUT", actorUserId: userId });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("love_liberia_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
