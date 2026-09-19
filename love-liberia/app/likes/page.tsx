import Link from "next/link";
import { Heart } from "lucide-react";

export default function LikesPage() {
  return <main className="min-h-screen bg-gray-950 px-5 py-10 text-white md:px-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-400">Connections</p><h1 className="mt-2 text-3xl font-black">Likes</h1><div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center"><Heart className="mx-auto h-10 w-10 text-rose-400" /><h2 className="mt-4 text-xl font-bold">See who is interested in you</h2><p className="mt-2 text-gray-400">Your incoming likes and connection activity will appear here.</p><Link href="/discover" className="mt-6 inline-flex rounded-xl bg-rose-500 px-5 py-3 font-bold text-white hover:bg-rose-600">Discover people</Link></div></div></main>;
}