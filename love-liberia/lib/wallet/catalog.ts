export const creditProducts = {
  BOOST: { label: "Profile Boost", description: "Be seen by more people for a limited time.", credits: 100, amountCents: 199 },
  SUPER_LIKES: { label: "Super Likes", description: "Stand out with five extra Super Likes.", credits: 50, amountCents: 199 },
  REWINDS: { label: "Rewinds", description: "Take back ten recent passes.", credits: 40, amountCents: 149 },
  GIFTS: { label: "Virtual Gifts", description: "Send five gifts to people you like.", credits: 25, amountCents: 99 },
} as const;

export type CreditProduct = keyof typeof creditProducts;
