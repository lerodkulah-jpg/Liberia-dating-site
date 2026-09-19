import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

async function getAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  return user && can(user.role, "dashboard") ? user : null;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin || !can(admin.role, "view_reports")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const flags = await prisma.userRiskFlag.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      flags: flags.map((flag) => ({
        id: flag.id,
        userId: flag.userId,
        username: flag.user.username,
        firstName: flag.user.firstName,
        email: flag.user.email,
        source: flag.source,
        score: flag.score,
        level: flag.level,
        reasons: flag.reasons,
        notes: flag.notes,
        status: flag.status,
        createdAt: flag.createdAt,
      })),
    });
  } catch (error) {
    console.error("Risk review fetch error:", error);
    return NextResponse.json({ error: "Unable to load risk flags." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin || !can(admin.role, "manage_users")) {
    return NextResponse.json({ error: "You do not have permission to review risk flags." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { flagId, action } = body;

    if (!flagId || !["dismiss", "escalate"].includes(action)) {
      return NextResponse.json({ error: "Valid flag and action are required." }, { status: 400 });
    }

    const flag = await prisma.userRiskFlag.findUnique({ where: { id: flagId } });
    if (!flag) {
      return NextResponse.json({ error: "Risk flag not found." }, { status: 404 });
    }

    await prisma.userRiskFlag.update({
      where: { id: flagId },
      data: {
        status: action === "dismiss" ? "DISMISSED" : "ESCALATED",
        reviewedAt: new Date(),
        resolvedBy: admin.id,
      },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Risk review update error:", error);
    return NextResponse.json({ error: "Unable to update risk flag." }, { status: 500 });
  }
}
