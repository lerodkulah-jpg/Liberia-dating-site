import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { hasImageSignature } from "@/lib/security/request";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const reviewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!reviewer || !can(reviewer.role, "verify_profiles")) return NextResponse.json({ error: "Profile verification reviewer access required." }, { status: 403 });

  try {
    const { verificationId } = await params;
    const submission = await prisma.verification.findFirst({
      where: { id: verificationId, type: "PHOTO", status: "PENDING" },
      select: { photoData: true, photoMimeType: true },
    });
    if (!submission?.photoData || !submission.photoMimeType) return NextResponse.json({ error: "Pending verification photo not found." }, { status: 404 });

    const bytes = new Uint8Array(submission.photoData);
    if (bytes.length > 5 * 1024 * 1024 || !hasImageSignature(bytes, submission.photoMimeType)) {
      return NextResponse.json({ error: "Verification photo is invalid." }, { status: 404 });
    }

    return new NextResponse(Uint8Array.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(bytes.length),
        "Content-Type": submission.photoMimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin verification photo error:", error);
    return NextResponse.json({ error: "Unable to load verification photo." }, { status: 500 });
  }
}