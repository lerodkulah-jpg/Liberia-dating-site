export const creditProducts = {
  BOOST: { label: "Profile Boost", description: "50 credits; 10 credits per 30-minute boost.", credits: 50, amountCents: 200 },
  SUPER_LIKES: { label: "Super Likes", description: "25 credits; 5 credits per Super Like.", credits: 25, amountCents: 199 },
  REWINDS: { label: "Rewinds", description: "10 credits; 1 credit per rewind.", credits: 10, amountCents: 149 },
  GIFTS: { label: "Virtual Gifts", description: "5 credits; 1 credit per gift.", credits: 5, amountCents: 99 },
} as const;

export type CreditProduct = keyof typeof creditProducts;
