import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppNavigation from "@/components/AppNavigation";
import PwaRegistration from "@/components/PwaRegistration";

export const metadata: Metadata = {
  title: "Love Liberia | Connect, Love & Belong",
  description:
    "Love Liberia is a modern dating platform connecting Liberians in Liberia and around the world.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/love-liberia-mark.png", apple: "/love-liberia-mark.png" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Love Liberia | Connect, Love & Belong",
    description: "Meet genuine people in Liberia and around the world through a safer, relationship-focused community.",
    url: "/",
    siteName: "Love Liberia",
    images: [{ url: "/love-liberia-logo.png", width: 768, height: 768, alt: "Love Liberia logo" }],
  },
  twitter: { card: "summary_large_image", title: "Love Liberia | Connect, Love & Belong", description: "Meet genuine people in Liberia and around the world.", images: ["/love-liberia-logo.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const stored = localStorage.getItem('love-liberia-theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = stored === 'dark' || (stored === 'system' && prefersDark) || (!stored && prefersDark);
                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                } catch (error) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Love Liberia", url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", logo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/love-liberia-logo.png`, sameAs: ["https://www.facebook.com/loveliberia", "https://www.instagram.com/loveliberia", "https://www.tiktok.com/@loveliberia", "https://x.com/loveliberia", "https://www.youtube.com/@loveliberia"] }) }} />
        <AppNavigation />
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}