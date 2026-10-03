export const giftCatalog = {
  HEART: { label: "Heart", emoji: "❤️", credits: 1 },
  ROSE: { label: "Rose", emoji: "🌹", credits: 1 },
  DIAMOND: { label: "Diamond", emoji: "💎", credits: 1 },
  GIFT_BOX: { label: "Gift Box", emoji: "🎁", credits: 1 },
  FLOWERS: { label: "Flowers", emoji: "💐", credits: 1 },
  RING: { label: "Ring", emoji: "💍", credits: 1 },
  STAR: { label: "Star", emoji: "⭐", credits: 1 },
} as const;

export type GiftType = keyof typeof giftCatalog;
