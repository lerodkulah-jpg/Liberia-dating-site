"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export default function InviteButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function shareInvite() {
    const inviteUrl = `${window.location.origin}/register?ref=${encodeURIComponent(username)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Join Love Liberia",
        text: "Join me on Love Liberia and meet genuine people.",
        url: inviteUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button
      type="button"
      onClick={() => void shareInvite()}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-950/40"
    >
      {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      {copied ? "Invite link copied" : "Invite someone"}
    </button>
  );
}
