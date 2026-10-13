import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { sameOrigin } from "@/lib/security/request";

async function getAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  return user && can(user.role, "manage_content") ? user : null;
}

export async function GET() {
  try {
    if (!(await getAdmin())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const requests = await prisma.user.findMany({
      where: { featuredStatus: "PENDING" },
      orderBy: { featuredRequestedAt: "asc" },
      select: {
        id: true,
        firstName: true,
        username: true,
        county: true,
        city: true,
        occupation: true,
        bio: true,
        profileImage: true,
        profileVisibility: true,
        featuredRequestedAt: true,
        isActive: true,
        isBanned: true,
      },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Admin featured profiles error:", error);
    return NextResponse.json(
      { error: "Unable to load feature requests." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body.userId !== "string" || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json({ error: "A user and valid review action are required." }, { status: 400 });
    }

    const updated = await prisma.user.updateMany({
      where: {
        id: body.userId,
        featuredStatus: "PENDING",
        ...(body.action === "approve"
          ? { profileVisibility: "PUBLIC", isActive: true, isBanned: false }
          : {}),
      },
      data: {
        featuredStatus: body.action === "approve" ? "APPROVED" : "REJECTED",
        featuredReviewedAt: new Date(),
        featuredReviewedById: admin.id,
      },
    });
    if (!updated.count) {
      return NextResponse.json(
        { error: "This request is no longer pending or the profile is not eligible." },
        { status: 409 }
      );
    }

    return NextResponse.json({ reviewed: true });
  } catch (error) {
    console.error("Admin featured profile review error:", error);
    return NextResponse.json(
      { error: "Unable to review feature request." },
      { status: 500 }
    );
  }
}
