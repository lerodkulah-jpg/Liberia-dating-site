export type PaidMembershipPlan = "PREMIUM" | "VIP";

export const MEMBERSHIP_PRICES: Record<PaidMembershipPlan, number> = {
  PREMIUM: 599,
  VIP: 1099,
};

export const FREE_DAILY_LIKE_LIMIT = 15;
export const FREE_DAILY_SUPER_LIKE_LIMIT = 5;

export function hasPaidMembershipAccess(plan: string | null | undefined, status: string | null | undefined) {
  return status === "ACTIVE" && (plan === "PREMIUM" || plan === "VIP");
}