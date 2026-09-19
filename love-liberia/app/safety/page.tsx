import Link from "next/link";
import { AlertTriangle, BadgeCheck, BellRing, Heart, LockKeyhole, MapPin, MessageSquareWarning, Phone, ShieldAlert, ShieldCheck, Users, Wallet } from "lucide-react";

const safetyTips = [
  {
    title: "Never send money to someone you just met",
    description: "Do not pay for travel, medical bills, visas, gifts, or emergency requests from someone you have not met in person and have not built trust with.",
    icon: Wallet,
  },
  {
    title: "Protect personal information",
    description: "Keep your home address, workplace, phone number, ID details, and banking information private until you are comfortable and confident.",
    icon: LockKeyhole,
  },
  {
    title: "Meet in public places",
    description: "Choose a busy café, restaurant, shopping center, or public venue for the first meeting. Meet during daylight hours when possible.",
    icon: MapPin,
  },
  {
    title: "Tell a trusted person about your date",
    description: "Share your date details, location, and time with a friend, family member, or roommate. Check in with them before and after the date.",
    icon: BellRing,
  },
  {
    title: "Report suspicious behavior",
    description: "If someone pressures you, acts aggressively, asks for money, or makes you feel unsafe, report the account immediately.",
    icon: MessageSquareWarning,
  },
  {
    title: "Block abusive users",
    description: "Use blocking and message controls as soon as someone becomes threatening, manipulative, or disrespectful.",
    icon: ShieldAlert,
  },
  {
    title: "Avoid sharing financial information",
    description: "Never share bank details, mobile money PINs, card numbers, or account credentials with someone you met online.",
    icon: Wallet,
  },
];

const emergencyResources = [
  {
    label: "Liberia National Police Emergency",
    detail: "Call 117 for urgent police assistance or if you feel in immediate danger.",
    icon: Phone,
  },
  {
    label: "Nearest hospital or clinic",
    detail: "Go to the nearest medical facility or clinic if you are injured, unwell, or need urgent support after a meeting.",
    icon: ShieldCheck,
  },
  {
    label: "Trusted family member or friend",
    detail: "Inform someone you trust about your location and plans before you meet someone in person.",
    icon: Users,
  },
  {
    label: "Support from local community leaders",
    detail: "If you feel unsafe, contact a trusted community leader, local authority, or a nearby business or venue staff member for help.",
    icon: BadgeCheck,
  },
];

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10">
            ← Back to dashboard
          </Link>
          <Link href="/register" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500">
            Create account
          </Link>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-red-500/25 bg-linear-to-br from-slate-900 via-slate-950 to-red-950 p-6 shadow-2xl shadow-red-950/20 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-200">
                Love Liberia Safety Center
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Dating Safety Center</h1>
              <p className="mt-4 max-w-xl text-base text-slate-300">
                Your safety matters. Take steps to protect yourself, trust your instincts, and seek help early if something feels wrong.
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/20 text-red-200 shadow-lg shadow-red-900/50">
              <Heart className="h-8 w-8 fill-current" />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Safety checklist</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {safetyTips.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/40">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Phone className="h-6 w-6 text-sky-400" />
            <h2 className="text-2xl font-black text-white">Emergency and support resources in Liberia</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {emergencyResources.map(({ label, detail, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100">
            <span className="font-bold">Important:</span> If you are in immediate danger, call local emergency services, move to a public place, or ask a trusted person to stay with you while you seek help.
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white">What to do if something feels wrong</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-50">
            <li>• Stop communicating and do not continue the conversation if you feel pressured or manipulated.</li>
            <li>• Block the person and report the activity from the app immediately.</li>
            <li>• Tell a trusted friend or family member what happened and ask for support.</li>
            <li>• If there is a real safety risk, contact the Liberia National Police or go to the nearest safe public place.</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/discover" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200">
            Keep browsing safely
          </Link>
          <Link href="/profile" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
            Review your privacy settings
          </Link>
        </div>
      </div>
    </main>
  );
}
