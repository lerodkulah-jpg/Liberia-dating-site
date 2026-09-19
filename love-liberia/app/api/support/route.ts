import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { createdById: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.subject !== "string" || !body.subject.trim() || typeof body.description !== "string" || !body.description.trim()) return NextResponse.json({ error: "Subject and description are required." }, { status: 400 });
  const ticket = await prisma.supportTicket.create({ data: { createdById: user.id, subject: body.subject.trim().slice(0, 160), description: body.description.trim().slice(0, 5000), priority: ["LOW", "NORMAL", "HIGH"].includes(body.priority) ? body.priority : "NORMAL" } });
  return NextResponse.json({ ticket }, { status: 201 });
}
