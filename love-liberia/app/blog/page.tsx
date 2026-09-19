import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SeoJsonLd from "../../components/SeoJsonLd";
import { prisma } from "../../lib/prisma";

export const metadata: Metadata = { title: "Love Liberia Magazine | Dating, Relationships, and Safety", description: "Love Liberia Magazine shares dating advice, relationship guidance, Liberia stories, long-distance perspectives, and practical safety tips." };
export const revalidate = 60;
const categories = ["Dating Advice", "Relationships", "Love & Marriage", "Dating Safety", "Liberia", "Long Distance Relationships", "Dating Abroad", "Success Stories"];

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const articles = await prisma.blogArticle.findMany({ where: { status: "PUBLISHED", deletedAt: null, ...(category && categories.includes(category) ? { category } : {}) }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, slug: true, excerpt: true, category: true, coverImage: true, publishedAt: true }, take: 50 });
  type ArticleCard = (typeof articles)[number];
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const renderArticle = (article: ArticleCard) => <article key={article.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{article.coverImage ? <Image src={article.coverImage} alt="" width={640} height={352} className="h-44 w-full object-cover" /> : <div className="h-44 bg-linear-to-br from-rose-100 via-white to-amber-100" />}<div className="p-6"><span className="text-xs font-black uppercase tracking-wide text-rose-600">{article.category}</span><h2 className="mt-2 text-xl font-black">{article.title}</h2><p className="mt-3 leading-7 text-slate-600">{article.excerpt}</p><Link href={`/blog/${article.slug}`} className="mt-5 inline-block font-bold text-rose-700">Read article</Link></div></article>;
  return <main className="min-h-screen bg-white px-5 py-14 text-slate-900"><SeoJsonLd title={metadata.title as string} description={metadata.description as string} url={`${url}/blog`} /><div className="mx-auto max-w-6xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-rose-600">Love Liberia Magazine</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Better conversations. Safer dating.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Stories, advice, and perspectives for Liberians in Liberia and around the world.</p><div className="mt-8 flex gap-2 overflow-x-auto pb-2">{["All", ...categories].map((item) => <Link key={item} href={item === "All" ? "/blog" : `/blog?category=${encodeURIComponent(item)}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"}`}>{item}</Link>)}</div>{articles.length === 0 ? <div className="mt-10 rounded-2xl border border-slate-200 p-10 text-center"><h2 className="text-xl font-black">The magazine is preparing its first issue.</h2><p className="mt-2 text-slate-600">Come back soon for new stories and practical dating guidance.</p></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map(renderArticle)}</div>}<Link href="/register" className="mt-10 inline-flex rounded-xl bg-rose-600 px-5 py-3 font-bold text-white">Join Love Liberia</Link></div></main>;
}
