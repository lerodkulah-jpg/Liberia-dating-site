"use client";

import { useEffect, useState } from "react";
import { Gift, Loader2, WalletCards } from "lucide-react";

const fallbackCatalog = {
  HEART: { label: "Heart", emoji: "❤️", credits: 5 },
  ROSE: { label: "Rose", emoji: "🌹", credits: 10 },
  DIAMOND: { label: "Diamond", emoji: "💎", credits: 25 },
  GIFT_BOX: { label: "Gift Box", emoji: "🎁", credits: 15 },
  FLOWERS: { label: "Flowers", emoji: "💐", credits: 20 },
  RING: { label: "Ring", emoji: "💍", credits: 40 },
  STAR: { label: "Star", emoji: "⭐", credits: 12 },
} as const;

type GiftPickerProps = { receiverId: string; receiverName: string };

export default function GiftPicker({ receiverId, receiverName }: GiftPickerProps) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState(fallbackCatalog);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/gifts", { cache: "no-store" }).then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        setCatalog(data.catalog || fallbackCatalog);
      }
    }).catch(() => undefined);
  }, []);

  async function sendGift(giftType: string) {
    setLoading(giftType);
    setMessage("");
    try {
      const response = await fetch("/api/gifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId, giftType }) });
      const data = await response.json();
      setMessage(data.message || data.error || "Unable to send gift.");
      if (response.ok) setOpen(false);
    } catch { setMessage("Unable to send gift."); } finally { setLoading(""); }
  }

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-800"><Gift className="h-4 w-4" />Send Gift</button>{open && <div className="absolute bottom-14 right-0 z-20 w-80 rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Send a gift to {receiverName}</h3><p className="mt-1 text-xs text-gray-400">Gifts use credits and cannot be converted to cash.</p></div><WalletCards className="h-5 w-5 text-amber-300" /></div><div className="mt-4 grid grid-cols-2 gap-2">{Object.entries(catalog).map(([key, gift]) => <button key={key} type="button" disabled={loading !== ""} onClick={() => void sendGift(key)} className="flex items-center gap-2 rounded-xl border border-gray-700 p-3 text-left hover:border-rose-400 disabled:opacity-50"><span className="text-2xl">{gift.emoji}</span><span><span className="block text-sm font-semibold">{gift.label}</span><span className="block text-xs text-gray-400">{gift.credits} credits</span></span>{loading === key && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}</button>)}</div><a href="/wallet" className="mt-4 block text-center text-xs font-semibold text-rose-300 hover:text-rose-200">Need credits? Open wallet</a></div>}{message && <p className="mt-2 text-center text-xs text-rose-300">{message}</p>}</div>;
}
