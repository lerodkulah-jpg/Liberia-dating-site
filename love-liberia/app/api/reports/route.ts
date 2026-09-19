import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const allowedReasons = new Set(["Fake profile", "Scam", "Harassment", "Hate speech", "Sexual content", "Spam", "Threats", "Impersonation", "Underage user", "Other"]);

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("love_liberia_token")?.value;

  if (!token) {
    return null;
  }

  return await verifyAuthToken(token);
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const reportedId = body.reportedId;
    const reason = body.reason;
    const details = typeof body.details === "string" ? body.details.trim().slice(0, 2000) : null;

    if (!reportedId) {
      return NextResponse.json(
        { error: "reportedId is required." },
        { status: 400 }
      );
    }

    if (!reason || !allowedReasons.has(String(reason))) {
      return NextResponse.json(
        { error: "Please select a report reason." },
        { status: 400 }
      );
    }

    if (reportedId === currentUserId) {
      return NextResponse.json(
        { error: "You cannot report yourself." },
        { status: 400 }
      );
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedId },
      select: { id: true },
    });

    if (!reportedUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: currentUserId,
        reportedId,
        reason: String(reason).trim(),
        details,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Report submitted successfully.",
        reportId: report.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Report user error:", error);

    return NextResponse.json(
      { error: "Unable to submit report." },
      { status: 500 }
    );
  }
}