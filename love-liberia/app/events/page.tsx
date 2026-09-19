import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liberia Dating Events | Love Liberia", description: "Find community events and activities that help Love Liberia members connect naturally and safely." };

export default function EventsPage() {
  return <main className="min-h-screen bg-gray-950 px-5 py-10 text-white md:px-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Community</p><h1 className="mt-2 text-3xl font-black">Events</h1><div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center"><CalendarDays className="mx-auto h-10 w-10 text-amber-300" /><h2 className="mt-4 text-xl font-bold">Community events are coming soon</h2><p className="mt-2 text-gray-400">We are preparing safe ways for Love Liberia members to connect in person and online.</p><Link href="/safety" className="mt-6 inline-flex rounded-xl border border-amber-400/40 px-5 py-3 font-bold text-amber-200 hover:bg-amber-400/10">Visit Safety Center</Link></div></div></main>;
}