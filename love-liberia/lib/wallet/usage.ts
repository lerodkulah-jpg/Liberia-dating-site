export const CREDIT_USAGE_COSTS = {
  PROFILE_BOOST_PER_30_MINUTES: 10,
  SUPER_LIKE: 5,
  REWIND: 1,
  VIRTUAL_GIFT: 1,
} as const;

export function getProfileBoostCreditCost(minutes: number) {
  return Math.ceil(minutes / 30) * CREDIT_USAGE_COSTS.PROFILE_BOOST_PER_30_MINUTES;
}