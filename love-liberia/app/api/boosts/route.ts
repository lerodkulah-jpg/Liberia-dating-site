import { NextResponse } from "next/server";
import { currentUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security/request";
import { spendWalletCredits } from "@/lib/wallet/spend";
import { getProfileBoostCreditCost } from "@/lib/wallet/usage";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const boosts = await prisma.boost.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ boosts });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  const minutes = Number(body.minutes || 30);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 24 * 60) return NextResponse.json({ error: "Boost duration must be between 5 minutes and 24 hours." }, { status: 400 });
  const creditsUsed = getProfileBoostCreditCost(minutes);
  const boost = await prisma.$transaction(async (transaction) => {
    const spent = await spendWalletCredits(transaction, user.id, creditsUsed, "PROFILE_BOOST_USE");
    if (!spent) return null;
    return transaction.boost.create({ data: { userId: user.id, endsAt: new Date(Date.now() + minutes * 60_000) } });
  });
  if (!boost) return NextResponse.json({ error: `Not enough credits. This boost costs ${creditsUsed} credits.` }, { status: 402 });
  return NextResponse.json({ boost, creditsUsed }, { status: 201 });
}
