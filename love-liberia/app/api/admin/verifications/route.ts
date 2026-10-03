import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { sameOrigin, writeSecurityAudit } from "@/lib/security/request";

async function getReviewer() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return null;

  const reviewer = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  return reviewer && can(reviewer.role, "verify_profiles") ? reviewer : null;
}

export async function GET() {
  const reviewer = await getReviewer();
  if (!reviewer) return NextResponse.json({ error: "Profile verification reviewer access required." }, { status: 403 });

  try {
    const submissions = await prisma.verification.findMany({
      where: { type: "PHOTO", status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        photoMimeType: true,
        user: {
          select: {
            firstName: true,
            username: true,
            profileImage: true,
            profilePhotos: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    return NextResponse.json({ submissions }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Photo verification queue error:", error);
    return NextResponse.json({ error: "Unable to load photo verification queue." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const reviewer = await getReviewer();
  if (!reviewer) return NextResponse.json({ error: "Profile verification reviewer access required." }, { status: 403 });

  try {
    const body = await request.json();
    const verificationId = typeof body.verificationId === "string" ? body.verificationId : "";
    const decision = body.decision === "APPROVE" || body.decision === "REJECT" ? body.decision : "";
    if (!verificationId || !decision) return NextResponse.json({ error: "A verification request and decision are required." }, { status: 400 });

    const submission = await prisma.verification.findUnique({
      where: { id: verificationId },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        photoMimeType: true,
        user: { select: { profileImage: true, _count: { select: { profilePhotos: true } } } },
      },
    });
    if (!submission || submission.type !== "PHOTO") return NextResponse.json({ error: "Photo verification request not found." }, { status: 404 });
    if (submission.status !== "PENDING" || !submission.photoMimeType) return NextResponse.json({ error: "This photo verification request is no longer pending." }, { status: 409 });

    const approved = decision === "APPROVE";
    if (approved && !submission.user.profileImage && submission.user._count.profilePhotos === 0) {
      return NextResponse.json({ error: "The member needs at least one profile photo before approval." }, { status: 409 });
    }
    const now = new Date();
    const updated = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.verification.updateMany({
        where: { id: verificationId, type: "PHOTO", status: "PENDING" },
        data: { status: approved ? "APPROVED" : "REJECTED", verifiedAt: now, photoData: null, photoMimeType: null },
      });
      if (claimed.count !== 1) return false;

      await transaction.user.update({
        where: { id: submission.userId },
        data: {
          photoVerified: approved,
          photoVerificationStatus: approved ? "APPROVED" : "REJECTED",
          verified: approved,
        },
      });
      return true;
    });
    if (!updated) return NextResponse.json({ error: "This photo verification request was already reviewed." }, { status: 409 });

    await writeSecurityAudit(request, {
      action: approved ? "PHOTO_VERIFICATION_APPROVED" : "PHOTO_VERIFICATION_REJECTED",
      actorUserId: reviewer.id,
      targetUserId: submission.userId,
    });

    return NextResponse.json({ verificationId, status: approved ? "APPROVED" : "REJECTED" });
  } catch (error) {
    console.error("Photo verification review error:", error);
    return NextResponse.json({ error: "Unable to review photo verification." }, { status: 500 });
  }
}