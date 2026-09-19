"use client";

import {
  ArrowRight,
  Check,
  Heart,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

const footerInfo = {
  "Discover People": "Set your location, age range, interests, and relationship goals to find compatible Liberians in Liberia and the diaspora.",
  Matches: "When two people express interest, they can start a conversation and decide together whether to meet or keep getting to know each other.",
  Events: "Find community meetups, cultural gatherings, and online activities designed to help members connect naturally.",
  "About Us": "Love Liberia is a relationship-focused community built to help Liberians make genuine connections across Liberia and around the world.",
  Safety: "Use profile verification, blocking, reporting, and privacy controls to keep your dating experience respectful and safer.",
  Privacy: "Control what you share, keep conversations private, and contact support if you see activity that makes you uncomfortable.",
  Terms: "Use honest information, respect other members, avoid harassment and scams, and only contact people who welcome communication.",
  "Help Center": "Find answers about getting started, profiles, privacy, messaging, safety, and account settings. Open the Support Center for searchable FAQs and help articles.",
  Contact: "Tell the support team what happened, include your username and a short description, and add any helpful screenshots or profile details. Open the Support Center to submit a ticket.",
  FAQs: "Learn how to update your profile, change messaging permissions, block or report someone, protect your account, and export or delete your data. Open the Support Center to browse all answers.",
  "Report a Problem": "Report fake profiles, scams, harassment, threats, suspicious requests, or technical issues. Use the in-app Report button for a member, or open the Support Center for a technical support ticket.",
} as const;

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeInfo, setActiveInfo] = useState<keyof typeof footerInfo | null>(null);

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          {/* Logo */}
          <a href="#home" className="flex min-h-11 items-center gap-3">
            <div className="brand-mark flex h-11 w-11 items-center justify-center">
              <span className="brand-stem" aria-hidden="true" />
              <span className="brand-leaf" aria-hidden="true" />
              <Heart
                size={23}
                className="brand-heart"
              />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight">
                Love<span className="text-red-600">Liberia</span>
              </h1>
              <p className="hidden text-[10px] font-medium text-gray-500 sm:block">
                Connect • Love • Belong
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-semibold transition hover:text-red-600"
            >
              Home
            </a>

            <a
              href="#how"
              className="text-sm font-semibold transition hover:text-red-600"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="text-sm font-semibold transition hover:text-red-600"
            >
              Features
            </a>

            <a
              href="#safety"
              className="text-sm font-semibold transition hover:text-red-600"
            >
              Safety
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Sign In
            </a>

            <a
              href="/register"
              className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl"
            >
              Join Free
            </a>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 transition hover:bg-gray-100 dark:hover:bg-gray-900 md:hidden"
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenu}
            aria-controls="mobile-navigation"
          >
            {mobileMenu ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div id="mobile-navigation" className="border-t border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-gray-950 md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#home"
                onClick={() => setMobileMenu(false)}
                className="flex min-h-11 w-full items-center rounded-xl px-3 font-semibold touch-manipulation hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Home
              </a>

              <a
                href="#how"
                onClick={() => setMobileMenu(false)}
                className="flex min-h-11 w-full items-center rounded-xl px-3 font-semibold touch-manipulation hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                How It Works
              </a>

              <a
                href="#features"
                onClick={() => setMobileMenu(false)}
                className="flex min-h-11 w-full items-center rounded-xl px-3 font-semibold touch-manipulation hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Features
              </a>

              <a
                href="#safety"
                onClick={() => setMobileMenu(false)}
                className="flex min-h-11 w-full items-center rounded-xl px-3 font-semibold touch-manipulation hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Safety
              </a>

              <div className="mt-2 flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <a
                  href="/login"
                  className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-gray-300 py-3 text-center font-bold touch-manipulation dark:border-gray-700"
                >
                  Sign In
                </a>

                <a
                  href="/register"
                  className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-red-600 py-3 text-center font-bold text-white touch-manipulation"
                >
                  Join Free
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden pt-32"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="hero-background-image" aria-hidden="true" />
          <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="hero-people" aria-hidden="true">
            <div className="floating-profile floating-profile-man">
              <UserRound size={34} strokeWidth={1.7} />
            </div>
            <div className="floating-profile floating-profile-woman">
              <UserRound size={34} strokeWidth={1.7} />
            </div>
            <Heart className="floating-heart" size={24} fill="currentColor" />
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 lg:grid-cols-2 lg:px-8 lg:pb-28">
          {/* Hero Text */}
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
              <Sparkles size={16} />
              Made for Liberians, everywhere
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Find someone who
              <span className="block text-red-600">
                feels like home.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-400">
              Meet genuine people from Liberia and around the world.
              Discover meaningful connections, real conversations and
              relationships that can last a lifetime.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a
                href="/register"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-7 py-4 font-bold text-white shadow-xl shadow-red-600/20 transition hover:-translate-y-1 hover:bg-red-700 sm:w-auto"
              >
                Start Dating
                <ArrowRight
                  size={19}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <a
                href="#how"
                className="flex min-h-11 w-full items-center justify-center rounded-full border border-gray-300 px-7 py-4 font-bold transition touch-manipulation hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900 sm:w-auto"
              >
                Learn More
              </a>
            </div>

            {/* Trust */}
            <div className="mt-9 flex flex-wrap gap-5 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Check size={17} className="text-green-500" />
                Free to join
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-green-500" />
                Safety focused
              </div>

              <div className="flex items-center gap-2">
                <Users size={17} className="text-green-500" />
                Liberia & diaspora
              </div>
            </div>
          </div>

          {/* Dating Card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-6 top-10 h-24 w-24 rounded-full bg-red-500/20 blur-2xl" />
            <div className="absolute -left-6 bottom-10 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-4xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <div className="couple-scene relative flex h-125 items-end overflow-hidden rounded-3xl">

                <div className="relative z-10 w-full bg-linear-to-t from-black/80 via-black/40 to-transparent p-7 pt-28 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-2xl font-black">
                      Real connections
                    </h3>
                    <div className="rounded-full bg-blue-500 p-1">
                      <Check size={13} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-200">
                    Genuine connections • Real conversations
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-lg transition hover:scale-110">
                      <Heart className="fill-current" size={21} />
                    </button>

                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110">
                      <MessageCircle size={21} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-200 px-5 py-10 dark:divide-gray-800 md:grid-cols-4 lg:px-8">
          <Stat number="18+" label="Members only" />
          <Stat number="24/7" label="Connections" />
          <Stat number="100%" label="Liberia focused" />
          <Stat number="∞" label="Possibilities" />
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="discover-people"
        className="mx-auto max-w-7xl px-5 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-red-600">
            Why Love Liberia?
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Dating made for real connections
          </h2>

          <p className="mt-5 text-gray-600 dark:text-gray-400">
            Everything you need to meet people, build trust and
            discover someone special.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Heart />}
            title="Smart Matching"
            description="Discover people based on your interests, preferences, lifestyle and relationship goals."
          />

          <FeatureCard
            icon={<MessageCircle />}
            title="Real-Time Chat"
            description="Talk naturally with your matches using a fast, modern and secure messaging system."
          />

          <FeatureCard
            icon={<ShieldCheck />}
            title="Dating Safety"
            description="Built-in reporting, blocking and verification tools help create a safer dating experience."
          />

          <FeatureCard
            icon={<Star />}
            title="Premium Discovery"
            description="Unlock advanced filters, profile boosts, Super Likes and other premium tools."
          />

          <FeatureCard
            icon={<Users />}
            title="Liberia & Diaspora"
            description="Connect with singles in Liberia and Liberians living in countries around the world."
          />

          <FeatureCard
            icon={<Sparkles />}
            title="Meaningful Experiences"
            description="Discover events, stories and communities built around friendship and relationships."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="bg-gray-50 py-24 dark:bg-gray-900/50"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-bold uppercase tracking-widest text-red-600">
              Simple & Easy
            </p>

            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              How it works
            </h2>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            <Step
              number="01"
              title="Create your profile"
              description="Tell people about yourself, your interests and the type of relationship you're looking for."
            />

            <Step
              number="02"
              title="Discover people"
              description="Browse recommended profiles and find people who share your interests and goals."
            />

            <Step
              number="03"
              title="Make a connection"
              description="Like each other, match, start a conversation and see where the connection takes you."
            />
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section
        id="safety"
        className="mx-auto max-w-7xl px-5 py-24 lg:px-8"
      >
        <div className="overflow-hidden rounded-4xl bg-gray-950 p-6 text-white sm:p-12 lg:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
                <ShieldCheck size={28} />
              </div>

              <h2 className="text-3xl font-black sm:text-5xl">
                Your safety comes first.
              </h2>

              <p className="mt-5 leading-7 text-gray-400">
                Love should feel exciting, not stressful. We are building
                tools that help users identify suspicious behavior, report
                abuse and control their privacy.
              </p>

              <a
                href="/safety"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-gray-950 transition hover:bg-gray-200"
              >
                Safety Center
                <ArrowRight size={18} />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SafetyItem text="Profile verification" />
              <SafetyItem text="Block & report tools" />
              <SafetyItem text="Privacy controls" />
              <SafetyItem text="Anti-scam protection" />
              <SafetyItem text="Secure messaging" />
              <SafetyItem text="Moderation system" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-4xl bg-linear-to-br from-red-600 to-red-800 px-6 py-16 text-center text-white shadow-2xl sm:px-12">
          <Heart className="mx-auto mb-5 fill-white" size={40} />

          <h2 className="text-3xl font-black sm:text-5xl">
            Your story could start today.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-red-100">
            Join Love Liberia and discover genuine people looking for
            friendship, dating and meaningful relationships.
          </p>

          <a
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-black text-red-600 shadow-xl transition hover:-translate-y-1"
          >
            Create Free Account
            <ArrowRight size={19} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
                  <Heart
                    size={20}
                    className="fill-white text-white"
                  />
                </div>

                <span className="text-xl font-black">
                  Love<span className="text-red-600">Liberia</span>
                </span>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-6 text-gray-500">
                Connecting hearts across Liberia and beyond.
              </p>
              <div className="mt-6 flex flex-wrap gap-2" aria-label="Love Liberia social media">
                {[
                  ["Facebook", "https://www.facebook.com/share/19TorK29Ee/"],
                  ["Instagram", "https://www.instagram.com/loveliberia"],
                  ["TikTok", "https://www.tiktok.com/@trickyfin?is_from_webapp=1&sender_device=pcto"],
                  ["X", "https://x.com/loveliberia"],
                  ["YouTube", "https://www.youtube.com/@loveliberia"],
                ].map(([label, href]) => <a key={label} href={href} target={label === "TikTok" ? "_self" : "_blank"} rel={label === "TikTok" ? undefined : "noreferrer"} className="rounded-full border border-gray-300 px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-300">{label}</a>)}
              </div>
            </div>

            <FooterColumn
              title="Discover"
              onSelect={setActiveInfo}
              links={[
                { label: "Home", href: "#home" },
                { label: "Discover People", href: "#discover-people" },
                { label: "Matches", href: "#matches" },
                { label: "Events", href: "#events" },
              ]}
            />

            <FooterColumn
              title="Company"
              onSelect={setActiveInfo}
              links={[
                { label: "About Us", href: "/about" },
                { label: "Safety Center", href: "/safety" },
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
              ]}
            />

            <FooterColumn
              title="Help"
              onSelect={setActiveInfo}
              links={[
                { label: "Help Center", href: "/support" },
                { label: "Contact", href: "/support#contact-support" },
                { label: "FAQs", href: "/support#faqs" },
                { label: "Report a Problem", href: "/support#report-problem" },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-7 text-center text-sm text-gray-500 dark:border-gray-800 md:flex-row md:text-left">
            <div>
              <p>© 2026 Love Liberia. All rights reserved.</p>
              <p>Contact developer: +250791495530 / +231888504430</p>
            </div>

            <p>Made for meaningful connections ❤️</p>
          </div>
        </div>
      </footer>

      {activeInfo && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-5 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-info-title"
          onClick={() => setActiveInfo(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close information"
              className="absolute right-5 top-5 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={() => setActiveInfo(null)}
            >
              <X size={20} />
            </button>
            <p className="pr-10 text-sm font-bold uppercase tracking-widest text-red-600">Love Liberia</p>
            <h2 id="footer-info-title" className="mt-3 pr-8 text-2xl font-black sm:text-3xl">{activeInfo}</h2>
            <p className="mt-5 leading-7 text-gray-600 dark:text-gray-300">{footerInfo[activeInfo]}</p>
            {(["Help Center", "Contact", "FAQs", "Report a Problem"] as const).includes(activeInfo as "Help Center" | "Contact" | "FAQs" | "Report a Problem") && (
              <a
                href={activeInfo === "Report a Problem" ? "/safety" : "/support"}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                onClick={() => setActiveInfo(null)}
              >
                {activeInfo === "Report a Problem" ? "Open Safety Center" : "Open Support Center"}
                <ArrowRight size={17} className="ml-2" />
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* STAT COMPONENT */

function Stat({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="px-4 text-center">
      <p className="text-3xl font-black text-red-600">
        {number}
      </p>

      <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

/* FEATURE COMPONENT */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-gray-200 bg-white p-7 transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white dark:bg-red-950/40">
        {icon}
      </div>

      <h3 className="text-xl font-black">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* STEP COMPONENT */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-xl font-black text-white shadow-xl shadow-red-600/20">
        {number}
      </div>

      <h3 className="mt-7 text-2xl font-black">{title}</h3>

      <p className="mx-auto mt-3 max-w-sm leading-7 text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* SAFETY COMPONENT */

function SafetyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
        <Check size={17} className="text-green-400" />
      </div>

      <span className="text-sm font-semibold">
        {text}
      </span>
    </div>
  );
}

/* FOOTER COMPONENT */

function FooterColumn({
  title,
  links,
  onSelect,
}: {
  title: string;
  links: { label: string; href: string }[];
  onSelect: (label: keyof typeof footerInfo) => void;
}) {
  return (
    <div>
      <h3 className="font-black">{title}</h3>

      <div className="mt-5 flex flex-col gap-3">
        {links.map((link) => {
          const infoKey = link.label as keyof typeof footerInfo;

          if (infoKey in footerInfo && link.href.startsWith("#")) {
            return (
              <button
                key={link.label}
                type="button"
                onClick={() => onSelect(infoKey)}
                className="flex min-h-11 w-full items-center text-left text-sm text-gray-500 touch-manipulation transition hover:text-red-600"
              >
                {link.label}
              </button>
            );
          }

          return (
            <a
              key={link.label}
              href={link.href}
              className="flex min-h-11 items-center text-sm text-gray-500 touch-manipulation transition hover:text-red-600"
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}