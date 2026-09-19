import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security/request";
import { isAdminRole } from "@/lib/admin/permissions";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const subscriptions = await prisma.subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { payments: true } });
  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (!["PREMIUM", "VIP"].includes(body.plan)) return NextResponse.json({ error: "A valid subscription plan is required." }, { status: 400 });
  // Self-service activation is not allowed: a paid plan may only be granted by a verified payment webhook or by an admin.
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Subscribe through checkout to activate a paid plan.", checkoutUrl: "/membership" }, { status: 402 });
  const subscription = await prisma.subscription.create({ data: { userId: user.id, plan: body.plan, endsAt: body.endsAt ? new Date(body.endsAt) : null } });
  return NextResponse.json({ subscription }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  // Members may cancel their own subscription, but only an admin can reactivate one,
  // otherwise a cancelled plan could be revived without payment.
  if (body.status !== "CANCELLED" && !isAdminRole(user.role)) return NextResponse.json({ error: "Only an admin can reactivate a subscription." }, { status: 403 });
  const subscription = await prisma.subscription.updateMany({ where: { id: body.subscriptionId, userId: user.id }, data: { status: body.status === "CANCELLED" ? "CANCELLED" : "ACTIVE" } });
  return subscription.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Subscription not found." }, { status: 404 });
}
