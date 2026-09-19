import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const paths = ["/", "/dating-in-liberia", "/singles-in-monrovia", "/liberia-dating", "/liberians-abroad", "/events", "/blog", "/support", "/safety", "/privacy", "/terms", "/cookies"];
  return paths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: path === "/" || path === "/blog" ? "weekly" : "monthly", priority: path === "/" ? 1 : 0.7 }));
}