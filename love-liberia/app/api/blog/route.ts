import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const slug = params.get("slug");
  if (slug) {
    const article = await prisma.blogArticle.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, include: { author: { select: { firstName: true, username: true } } } });
    return article ? NextResponse.json({ article }) : NextResponse.json({ error: "Article not found." }, { status: 404 });
  }
  const articles = await prisma.blogArticle.findMany({ where: { status: "PUBLISHED", deletedAt: null, ...(category ? { category } : {}) }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, slug: true, excerpt: true, category: true, coverImage: true, publishedAt: true }, take: 50 });
  return NextResponse.json({ articles }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
