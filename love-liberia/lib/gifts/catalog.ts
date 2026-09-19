export const giftCatalog = {
  HEART: { label: "Heart", emoji: "❤️", credits: 5 },
  ROSE: { label: "Rose", emoji: "🌹", credits: 10 },
  DIAMOND: { label: "Diamond", emoji: "💎", credits: 25 },
  GIFT_BOX: { label: "Gift Box", emoji: "🎁", credits: 15 },
  FLOWERS: { label: "Flowers", emoji: "💐", credits: 20 },
  RING: { label: "Ring", emoji: "💍", credits: 40 },
  STAR: { label: "Star", emoji: "⭐", credits: 12 },
} as const;

export type GiftType = keyof typeof giftCatalog;
