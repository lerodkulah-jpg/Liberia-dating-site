import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getUserId() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  return token ? verifyAuthToken(token) : null;
}

function ageFrom(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  if (today.getMonth() < dateOfBirth.getMonth() || (today.getMonth() === dateOfBirth.getMonth() && today.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { membershipPlan: true } });
  if (!owner || !["PREMIUM", "VIP"].includes(owner.membershipPlan)) return NextResponse.json({ error: "Who Viewed Me is available with Premium or VIP membership." }, { status: 403 });

  const views = await prisma.profileView.findMany({ where: { viewedUserId: userId }, orderBy: { createdAt: "desc" }, take: 100 });
  const viewerIds = [...new Set(views.map((view) => view.viewerId))];
  const viewers = await prisma.user.findMany({ where: { id: { in: viewerIds }, isActive: true }, select: { id: true, firstName: true, dateOfBirth: true, country: true, county: true, profileImage: true } });
  const byId = new Map(viewers.map((viewer) => [viewer.id, viewer]));
  return NextResponse.json({ visitors: views.flatMap((view) => { const viewer = byId.get(view.viewerId); return viewer ? [{ id: viewer.id, firstName: viewer.firstName, age: ageFrom(viewer.dateOfBirth), location: [viewer.county, viewer.country].filter(Boolean).join(", ") || "Liberia", profileImage: viewer.profileImage, viewedAt: view.createdAt }] : []; }) });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "enabled must be a boolean." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { profileViewTracking: body.enabled } });
  return NextResponse.json({ profileViewTracking: body.enabled });
}
