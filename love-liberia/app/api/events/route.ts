import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const events = await prisma.event.findMany({ where: { deletedAt: null, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, include: { registrations: { where: { userId: user.id }, select: { id: true, status: true } } }, take: 100 });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.title !== "string" || !body.title.trim() || typeof body.startsAt !== "string") return NextResponse.json({ error: "Title and start time are required." }, { status: 400 });
  const event = await prisma.event.create({ data: { createdById: user.id, title: body.title.trim().slice(0, 160), description: typeof body.description === "string" ? body.description.slice(0, 2000) : null, startsAt: new Date(body.startsAt), endsAt: typeof body.endsAt === "string" ? new Date(body.endsAt) : undefined, location: typeof body.location === "string" ? body.location.slice(0, 240) : null } });
  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.eventId !== "string" || typeof body.status !== "string") return NextResponse.json({ error: "Event and status are required." }, { status: 400 });
  const registration = await prisma.eventRegistration.upsert({ where: { eventId_userId: { eventId: body.eventId, userId: user.id } }, update: { status: body.status }, create: { eventId: body.eventId, userId: user.id, status: body.status } });
  return NextResponse.json({ registration });
}
