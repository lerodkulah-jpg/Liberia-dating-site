import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { rateLimit, sameOrigin } from "@/lib/security/request";

async function getCurrentUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const limit = await rateLimit(request, "featured-profile-request", 5, 60 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many feature requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const body = await request.json();
    if (body.action !== "request" && body.action !== "withdraw") {
      return NextResponse.json({ error: "Choose a valid feature request action." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, isBanned: true, profileVisibility: true, featuredStatus: true },
    });
    if (!user || !user.isActive || user.isBanned) {
      return NextResponse.json({ error: "Your account cannot request a homepage feature." }, { status: 403 });
    }

    if (body.action === "request") {
      if (user.profileVisibility !== "PUBLIC") {
        return NextResponse.json(
          { error: "Set your profile visibility to public before requesting a feature." },
          { status: 400 }
        );
      }
      if (user.featuredStatus === "PENDING" || user.featuredStatus === "APPROVED") {
        return NextResponse.json({ error: "You already have an active feature request." }, { status: 409 });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          featuredStatus: "PENDING",
          featuredRequestedAt: new Date(),
          featuredReviewedAt: null,
          featuredReviewedById: null,
        },
        select: { featuredStatus: true },
      });
      return NextResponse.json({ user: updated });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        featuredStatus: "NONE",
        featuredRequestedAt: null,
        featuredReviewedAt: null,
        featuredReviewedById: null,
      },
      select: { featuredStatus: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Featured profile request error:", error);
    return NextResponse.json(
      { error: "Unable to update your featured profile request." },
      { status: 500 }
    );
  }
}
