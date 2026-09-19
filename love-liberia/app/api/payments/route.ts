import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const payments = await prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (!Number.isInteger(body.amountCents) || body.amountCents <= 0 || body.amountCents > 10_000_000) return NextResponse.json({ error: "A valid payment amount is required." }, { status: 400 });
  const payment = await prisma.payment.create({ data: { userId: user.id, subscriptionId: typeof body.subscriptionId === "string" ? body.subscriptionId : null, amountCents: body.amountCents, currency: typeof body.currency === "string" ? body.currency.toUpperCase().slice(0, 3) : "USD", provider: typeof body.provider === "string" ? body.provider.slice(0, 40) : null } });
  return NextResponse.json({ payment }, { status: 201 });
}
