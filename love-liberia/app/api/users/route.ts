import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const viewer = await currentUser();
  if (!viewer) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search")?.trim() || "";
  const users = await prisma.user.findMany({ where: { isActive: true, isBanned: false, ...(search ? { OR: [{ firstName: { contains: search } }, { username: { contains: search } }] } : {}) }, select: { id: true, firstName: true, username: true, profileImage: true, verified: true, county: true, city: true, isOnline: true, createdAt: true }, take: 100, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}
