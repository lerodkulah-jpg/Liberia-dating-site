import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: ["/", "/dating-in-liberia", "/singles-in-monrovia", "/liberia-dating", "/liberians-abroad", "/events", "/blog", "/support", "/safety", "/privacy", "/terms", "/cookies"], disallow: ["/api/", "/admin/", "/dashboard", "/discover", "/matches", "/messages", "/profile", "/settings", "/login", "/register"] }], sitemap: `${baseUrl}/sitemap.xml` };
}