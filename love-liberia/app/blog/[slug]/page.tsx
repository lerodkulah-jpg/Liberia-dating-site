import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.blogArticle.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, select: { title: true, excerpt: true } });
  return article ? { title: `${article.title} | Love Liberia Magazine`, description: article.excerpt } : { title: "Article not found | Love Liberia Magazine" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.blogArticle.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, include: { author: { select: { firstName: true } } } });
  if (!article) notFound();
  return <main className="min-h-screen bg-white px-5 py-14 text-slate-900"><article className="mx-auto max-w-3xl"><Link href="/blog" className="font-bold text-rose-700">Back to Love Liberia Magazine</Link><p className="mt-10 text-sm font-black uppercase tracking-wide text-rose-600">{article.category}</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{article.title}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{article.excerpt}</p><p className="mt-4 text-sm text-slate-500">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}{article.author ? ` · By ${article.author.firstName}` : ""}</p>{article.coverImage && <Image src={article.coverImage} alt="" width={1024} height={576} className="mt-8 max-h-112 w-full rounded-2xl object-cover" />}<div className="mt-10 whitespace-pre-wrap text-lg leading-8 text-slate-700">{article.content}</div></article></main>;
}
