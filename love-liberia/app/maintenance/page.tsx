import Link from "next/link";
import { Hammer, Heart, RefreshCw, Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.2),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.16),transparent_30%)]" aria-hidden="true" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[44px_44px]" aria-hidden="true" />

      <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="mx-auto flex w-fit items-center gap-2 text-rose-300">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-950/50">
            <Heart className="h-6 w-6 fill-white text-white" />
          </span>
          <span className="text-xl font-black tracking-tight">Love Liberia</span>
        </div>

        <div className="mx-auto mt-10 flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200">
          <Wrench className="h-11 w-11" />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Back soon</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">The site is under maintenance</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-300">
          We are making a few improvements to Love Liberia. Your connections and account will be waiting when we are finished.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"><Hammer className="h-4 w-4 text-amber-300" /> Improving your experience</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"><RefreshCw className="h-4 w-4 text-sky-300" /> Please check again soon</span>
        </div>

        <Link href="/" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-rose-500 px-6 py-3 font-bold text-white transition hover:bg-rose-400">
          Return to Love Liberia
        </Link>
      </section>
    </main>
  );
}