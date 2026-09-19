import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const calls = await prisma.call.findMany({ where: { OR: [{ callerId: user.id }, { receiverId: user.id }] }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ calls });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.receiverId !== "string" || !["AUDIO", "VIDEO"].includes(body.type || "AUDIO")) return NextResponse.json({ error: "Receiver and call type are required." }, { status: 400 });
  if (body.receiverId === user.id) return NextResponse.json({ error: "You cannot call yourself." }, { status: 400 });
  const call = await prisma.call.create({ data: { callerId: user.id, receiverId: body.receiverId, conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined, type: body.type || "AUDIO" } });
  return NextResponse.json({ call }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (typeof body.callId !== "string" || !["ACCEPTED", "DECLINED", "ENDED", "MISSED"].includes(body.status)) return NextResponse.json({ error: "Call and valid status are required." }, { status: 400 });
  const call = await prisma.call.findFirst({ where: { id: body.callId, OR: [{ callerId: user.id }, { receiverId: user.id }] } });
  if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
  const updated = await prisma.call.update({ where: { id: call.id }, data: { status: body.status, startedAt: body.status === "ACCEPTED" ? new Date() : undefined, endedAt: ["ENDED", "DECLINED", "MISSED"].includes(body.status) ? new Date() : undefined } });
  return NextResponse.json({ call: updated });
}
