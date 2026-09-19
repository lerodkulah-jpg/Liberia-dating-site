"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Heart, Loader2, Sparkles } from "lucide-react";

type Visitor = { id: string; firstName: string; age: number; location: string; profileImage: string | null; viewedAt: string };

function viewedTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tracking, setTracking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile/views", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (response.status === 403) { setUpgradeRequired(true); return; }
      if (!response.ok) { setError(data.error || "Unable to load visitors."); return; }
      setVisitors(data.visitors || []);
    }).catch(() => setError("Unable to load visitors.")).finally(() => setLoading(false));
  }, []);

  async function updateTracking(enabled: boolean) {
    setTracking(enabled);
    await fetch("/api/profile/views", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white"><Loader2 className="h-10 w-10 animate-spin text-rose-500" /></main>;
  return <main className="min-h-screen bg-gray-950 text-white"><nav className="border-b border-gray-800 bg-gray-900"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4"><Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-rose-400"><ArrowLeft className="h-5 w-5" />Dashboard</Link><div className="flex items-center gap-2 font-bold text-rose-400"><Heart className="h-5 w-5 fill-rose-500" />Who Viewed Me</div><Eye className="h-5 w-5 text-rose-300" /></div></nav><section className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-rose-300">Premium feature</p><h1 className="mt-3 text-4xl font-black">Who Viewed Me</h1><p className="mt-2 text-gray-400">See who has taken a closer look at your profile.</p></div><label className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm"><input type="checkbox" checked={tracking} onChange={(event) => void updateTracking(event.target.checked)} className="h-5 w-5 accent-rose-500" />Show my visits</label></div>{upgradeRequired ? <div className="mt-10 rounded-3xl border border-rose-400/30 bg-linear-to-br from-rose-950 to-purple-950 p-8 text-center"><Sparkles className="mx-auto h-10 w-10 text-amber-300" /><h2 className="mt-4 text-2xl font-black">Unlock Who Viewed Me</h2><p className="mx-auto mt-2 max-w-md text-gray-300">Upgrade to Premium or VIP to see profile visitors.</p><Link href="/membership" className="mt-6 inline-flex rounded-xl bg-rose-300 px-5 py-3 font-bold text-rose-950">View membership plans</Link></div> : error ? <p className="mt-8 rounded-xl bg-red-950/50 p-4 text-red-200">{error}</p> : visitors.length === 0 ? <div className="mt-10 rounded-3xl border border-gray-800 bg-gray-900 p-10 text-center"><Eye className="mx-auto h-12 w-12 text-gray-600" /><h2 className="mt-4 text-2xl font-bold">No visitors yet</h2><p className="mt-2 text-gray-400">When members visit your profile, they&apos;ll appear here.</p></div> : <div className="mt-8 grid gap-4 sm:grid-cols-2">{visitors.map((visitor) => <article key={`${visitor.id}-${visitor.viewedAt}`} className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-950 text-xl font-bold text-rose-300">{visitor.profileImage ? <Image src={visitor.profileImage} alt={visitor.firstName} fill sizes="64px" className="object-cover" /> : visitor.firstName.charAt(0).toUpperCase()}</div><div className="min-w-0"><h2 className="font-bold">{visitor.firstName}, {visitor.age}</h2><p className="text-sm text-gray-400">{visitor.location}</p><p className="mt-1 text-xs text-rose-300">Viewed {viewedTime(visitor.viewedAt)}</p></div><Link href={`/matches/${visitor.id}`} className="ml-auto rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800">View</Link></article>)}</div>}</section></main>;
}
