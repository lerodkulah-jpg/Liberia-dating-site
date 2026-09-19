import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function StoriesPage() {
  return <main className="min-h-screen bg-gray-950 px-5 py-10 text-white md:px-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Community</p><h1 className="mt-2 text-3xl font-black">Stories</h1><div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center"><Sparkles className="mx-auto h-10 w-10 text-sky-300" /><h2 className="mt-4 text-xl font-bold">Stories are coming soon</h2><p className="mt-2 text-gray-400">Share the moments, places, and people that make Liberia feel like home.</p><Link href="/profile" className="mt-6 inline-flex rounded-xl bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-600">View your profile</Link></div></div></main>;
}