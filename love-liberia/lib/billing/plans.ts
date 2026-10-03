import { prisma } from "@/lib/prisma";
import { hasPaidMembershipAccess } from "./plan-config";

export { FREE_DAILY_LIKE_LIMIT, FREE_DAILY_SUPER_LIKE_LIMIT, hasPaidMembershipAccess, MEMBERSHIP_PRICES, type PaidMembershipPlan } from "./plan-config";

export async function hasActivePaidMembership(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipPlan: true, membershipStatus: true },
  });
  if (!user || !hasPaidMembershipAccess(user.membershipPlan, user.membershipStatus)) return false;

  const subscription = await prisma.subscription.findFirst({
    where: { userId, plan: user.membershipPlan, status: { in: ["ACTIVE", "CANCELLED"] } },
    orderBy: { createdAt: "desc" },
    select: { status: true, endsAt: true },
  });
  if (!subscription) return true;
  return subscription.status === "ACTIVE" && (!subscription.endsAt || subscription.endsAt > new Date());
}