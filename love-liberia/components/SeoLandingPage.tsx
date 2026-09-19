import Link from "next/link";
import SeoJsonLd from "@/components/SeoJsonLd";

type SeoLandingPageProps = { eyebrow: string; title: string; description: string; paragraphs: string[]; links: { href: string; label: string }[]; urlPath: string };

export default function SeoLandingPage({ eyebrow, title, description, paragraphs, links, urlPath }: SeoLandingPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return <main className="min-h-screen bg-white text-slate-900"><SeoJsonLd title={title} description={description} url={`${siteUrl}${urlPath}`} /><section className="border-b border-rose-100 bg-rose-50 px-5 py-16 sm:py-24"><div className="mx-auto max-w-4xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-600">{eyebrow}</p><h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{description}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="rounded-xl bg-rose-600 px-5 py-3 font-bold text-white hover:bg-rose-700">Join Love Liberia</Link><Link href="/discover" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-white">Explore connections</Link></div></div></section><section className="mx-auto max-w-4xl px-5 py-12 sm:py-16"><div className="max-w-3xl space-y-6 text-lg leading-8 text-slate-600">{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-12 grid gap-3 sm:grid-cols-2">{links.map((link) => <Link key={link.href} href={link.href} className="rounded-xl border border-slate-200 p-4 font-bold text-rose-700 hover:border-rose-300 hover:bg-rose-50">{link.label}</Link>)}</div></section></main>;
}
