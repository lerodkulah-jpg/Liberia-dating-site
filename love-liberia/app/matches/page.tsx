"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Heart, Loader2, MapPin, MessageCircle, Star } from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";

type Match = { id: string; firstName: string; username: string; age: number; county: string | null; profileImage: string | null; verified: boolean; isOnline: boolean };

type Category = "new" | "recent" | "favorites";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/matches");
        const data = await response.json();
        if (!response.ok) { setError(data.error || "Unable to load matches."); return; }
        setMatches(data.matches || []);
        const favoritesResponse = await fetch("/api/favorites");
        if (favoritesResponse.ok) setFavorites((await favoritesResponse.json()).favoriteUserIds || []);
      } catch { setError("Unable to connect to the server."); } finally { setLoading(false); }
    }
    void loadMatches();
  }, []);

  async function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
    const response = await fetch(favorites.includes(id) ? `/api/favorites?userId=${encodeURIComponent(id)}` : "/api/favorites", { method: favorites.includes(id) ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: favorites.includes(id) ? undefined : JSON.stringify({ favoriteUserId: id }) });
    if (response.ok) setFavorites(next);
  }

  const visibleMatches = category === "favorites" ? matches.filter((match) => favorites.includes(match.id)) : category === "recent" ? matches.slice().sort((a, b) => Number(b.isOnline) - Number(a.isOnline)) : matches;

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white"><Loader2 className="h-10 w-10 animate-spin text-rose-500" /></main>;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4"><Link href="/dashboard" className="flex min-h-11 items-center gap-2 text-gray-300 hover:text-rose-400"><ArrowLeft className="h-5 w-5" />Dashboard</Link><div className="flex items-center gap-2 font-bold text-rose-400"><Heart className="h-5 w-5 fill-rose-500" />Love Liberia</div><OnlineStatus /><Link href="/discover" className="flex min-h-11 items-center text-gray-300 hover:text-rose-400">Discover</Link></div></nav>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 text-center"><Heart className="mx-auto h-12 w-12 fill-rose-500 text-rose-500" /><h1 className="mt-5 text-3xl font-bold">Your Matches</h1><p className="mt-2 text-gray-300">People who liked you back.</p></div>
        <div className="mb-8 flex justify-center gap-2"><button type="button" onClick={() => setCategory("new")} className={`rounded-full px-4 py-2 text-sm font-bold ${category === "new" ? "bg-rose-500 text-white" : "bg-gray-800 text-gray-300"}`}>New Matches</button><button type="button" onClick={() => setCategory("recent")} className={`rounded-full px-4 py-2 text-sm font-bold ${category === "recent" ? "bg-rose-500 text-white" : "bg-gray-800 text-gray-300"}`}>Recent Matches</button><button type="button" onClick={() => setCategory("favorites")} className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold ${category === "favorites" ? "bg-rose-500 text-white" : "bg-gray-800 text-gray-300"}`}><Star className="h-4 w-4" />Favorites</button></div>
        {error && <div className="mx-auto mb-6 max-w-lg rounded-xl bg-red-950/60 p-4 text-center text-red-200">{error}</div>}
        {visibleMatches.length === 0 ? <div className="mx-auto max-w-lg rounded-3xl border border-gray-800 bg-gray-900 p-7 text-center sm:p-10"><Heart className="mx-auto h-14 w-14 text-gray-500" /><h2 className="mt-5 text-2xl font-bold">{category === "favorites" ? "No favorite matches yet" : "No matches yet"}</h2><p className="mt-2 text-gray-300">Keep discovering people. Mutual likes will appear here.</p><Link href="/discover" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white">Discover People</Link></div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleMatches.map((match) => <article key={match.id} className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900"><Link href={`/matches/${match.id}`} className="block"><div className="relative flex h-60 items-center justify-center bg-linear-to-br from-rose-950 to-pink-950 sm:h-72">{match.profileImage ? <Image src={match.profileImage} alt={match.firstName} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-800 text-4xl font-bold text-rose-400">{match.firstName.charAt(0).toUpperCase()}</div>}<div className="absolute right-4 top-4"><OnlineStatus isOnline={match.isOnline} /></div></div><div className="p-5"><div className="flex items-center gap-2"><h2 className="text-xl font-bold">{match.firstName}, {match.age}</h2>{match.verified && <BadgeCheck className="h-5 w-5 text-blue-400" />}</div><p className="text-sm text-gray-400">@{match.username}</p><p className="mt-3 flex items-center gap-2 text-sm text-gray-300"><MapPin className="h-4 w-4" />{match.county || "Liberia"}</p></div></Link><div className="flex gap-2 px-5 pb-5"><button type="button" onClick={() => toggleFavorite(match.id)} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${favorites.includes(match.id) ? "border-amber-400 text-amber-300" : "border-gray-700 text-gray-200"}`}><Star className="h-4 w-4" />{favorites.includes(match.id) ? "Favorite" : "Add favorite"}</button><Link href={`/messages/${match.id}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white"><MessageCircle className="h-4 w-4" />Chat</Link></div></article>)}</div>}
      </section>
    </main>
  );
}
