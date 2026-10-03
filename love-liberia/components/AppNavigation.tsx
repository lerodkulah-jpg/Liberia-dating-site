"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Compass,
  Crown,
  Heart,
  Home,
  MessageCircle,
  Settings,
  Sparkles,
  LifeBuoy,
  User,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const mobileItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

const desktopItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/likes", label: "Likes", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/stories", label: "Stories", icon: Sparkles },
  { href: "/membership", label: "Premium", icon: Crown },
  { href: "/settings/privacy", label: "Settings", icon: Settings },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavigation() {
  const pathname = usePathname();
  const hiddenRoutes = ["/", "/login", "/register", "/admin", "/privacy", "/terms", "/cookies", "/safety"];

  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (pathname === "/") return null;

    return (
      <ThemeToggle
        className="fixed bottom-6 right-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-lg transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      />
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white/95 backdrop-blur-lg dark:border-white/10 dark:bg-gray-950/95 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 xl:gap-7 xl:px-6">
          <Link href="/dashboard" className="mr-1 flex shrink-0 items-center gap-2 text-lg font-black text-rose-700 dark:text-rose-400" aria-label="Love Liberia home">
            <img src="/icon.svg" alt="Love Liberia logo" className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-400/60 ring-offset-2 ring-offset-white dark:ring-offset-gray-950" />
            <span>Love Liberia</span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center justify-between gap-0.5 xl:gap-1" aria-label="Main navigation">
            {desktopItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                  <Link key={href} href={href} className={`flex items-center gap-1 rounded-lg px-1.5 py-2 text-xs font-semibold transition xl:gap-1.5 xl:px-2.5 xl:text-sm ${active ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`} aria-current={active ? "page" : undefined}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/95 dark:shadow-[0_-8px_30px_rgba(0,0,0,0.25)] lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
          {mobileItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition ${active ? "bg-rose-500 text-white shadow-lg shadow-rose-950/40" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`} aria-current={active ? "page" : undefined}>
                <Icon className={`h-5 w-5 ${active ? "fill-white/15" : ""}`} />
                <span>{label}</span>
              </Link>
            );
          })}
          <ThemeToggle showLabel className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white" />
        </div>
      </nav>
    </>
  );
}
