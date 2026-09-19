import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const boosts = await prisma.boost.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ boosts });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  const minutes = Number(body.minutes || 30);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 24 * 60) return NextResponse.json({ error: "Boost duration must be between 5 minutes and 24 hours." }, { status: 400 });
  const boost = await prisma.boost.create({ data: { userId: user.id, endsAt: new Date(Date.now() + minutes * 60_000) } });
  return NextResponse.json({ boost }, { status: 201 });
}
