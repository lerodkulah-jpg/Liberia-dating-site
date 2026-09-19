import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

async function getAdminUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get("love_liberia_token")?.value;

  if (!token) {
    return null;
  }

  const userId = await verifyAuthToken(token);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || !can(user.role, "view_reports")) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            username: true,
            email: true,
          },
        },
        reported: {
          select: {
            id: true,
            firstName: true,
            username: true,
            email: true,
          },
        },
      },
    });
    const audits = await prisma.moderationAudit.findMany({ where: { reportId: { in: reports.map((report) => report.id) } }, orderBy: { createdAt: "desc" } });
    const auditsByReport = new Map<string, typeof audits>();
    for (const audit of audits) auditsByReport.set(audit.reportId, [...(auditsByReport.get(audit.reportId) || []), audit]);

    return NextResponse.json({
      reports: reports.map((report) => ({ ...report, auditLog: auditsByReport.get(report.id) || [] })),
    });
  } catch (error) {
    console.error("Admin reports error:", error);

    return NextResponse.json(
      {
        error: "Unable to load reports.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { reportId, action, notes } = await request.json();
    const allowedActions = ["REVIEW", "WARN", "SUSPEND", "BAN", "REMOVE_CONTENT", "CLOSE"];

    if (
      typeof reportId !== "string" ||
      typeof action !== "string" ||
      !allowedActions.includes(action)
    ) {
      return NextResponse.json(
        { error: "A valid reportId and moderation action are required." },
        { status: 400 }
      );
    }

    if (["SUSPEND", "BAN", "REMOVE_CONTENT"].includes(action) && !can(admin.role, "manage_users")) return NextResponse.json({ error: "You do not have permission for this moderation action." }, { status: 403 });
    const existing = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true, reportedId: true } });
    if (!existing) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    const status = action === "CLOSE" ? "RESOLVED" : action === "REVIEW" ? "REVIEWED" : "PENDING";
    const report = await prisma.$transaction(async (transaction) => {
      if (action === "SUSPEND") await transaction.user.update({ where: { id: existing.reportedId }, data: { isActive: false } });
      if (action === "BAN") await transaction.user.update({ where: { id: existing.reportedId }, data: { isActive: false, isBanned: true } });
      if (action === "REMOVE_CONTENT") await transaction.user.update({ where: { id: existing.reportedId }, data: { profileImage: null, bio: null } });
      const updated = await transaction.report.update({ where: { id: reportId }, data: { status, action }, select: { id: true, status: true, action: true, details: true } });
      await transaction.moderationAudit.create({ data: { reportId, moderatorId: admin.id, targetUserId: existing.reportedId, action, notes: typeof notes === "string" ? notes.trim().slice(0, 2000) : null } });
      return updated;
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Admin report status error:", error);
    return NextResponse.json(
      { error: "Unable to update report status." },
      { status: 500 }
    );
  }
}