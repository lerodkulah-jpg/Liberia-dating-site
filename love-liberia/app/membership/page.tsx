"use client";

import Link from "next/link";
import { Check, Crown, Heart, Loader2, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "Free",
    description: "Everything you need to start meeting people.",
    icon: Heart,
    featured: false,
    features: ["Create profile", "Upload photos", "Limited likes", "Match", "Basic messaging", "Basic search"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "$9.99 / month",
    description: "More control, more discovery, more chances to connect.",
    icon: Sparkles,
    featured: true,
    features: ["Everything in Free", "Unlimited likes", "See who liked you", "Advanced filters", "Unlimited messaging", "Unlimited rewinds", "More Super Likes", "Incognito mode", "Profile boost", "Priority discovery", "Read receipts", "Advanced compatibility insights"],
  },
  {
    id: "VIP",
    name: "VIP",
    price: "$19.99 / month",
    description: "The most visible and supported Love Liberia experience.",
    icon: Crown,
    featured: false,
    features: ["Everything in Premium", "Priority support", "Extra boosts", "Premium badge", "VIP discovery", "More Super Likes", "Exclusive events"],
  },
] as const;

type Membership = { membershipPlan: string; membershipStatus: string };
type PaymentMethod = "BANK_TRANSFER" | "MOBILE_MONEY";
type MobileMoneyProvider = "Orange Money" | "MTN Mobile Money" | "Lonestar Cell" | "Other";

const mobileMoneyOptions: Array<{ label: string; value: MobileMoneyProvider }> = [
  { label: "Orange Money", value: "Orange Money" },
  { label: "MTN Mobile Money", value: "MTN Mobile Money" },
  { label: "Lonestar Cell", value: "Lonestar Cell" },
  { label: "Other mobile money provider", value: "Other" },
];

const bankOptions = [
  "Ecobank Liberia",
  "Access Bank Liberia",
  "United Bank for Africa (UBA)",
  "Other bank account",
];

export default function MembershipPage() {
  const [membership, setMembership] = useState<Membership>({ membershipPlan: "FREE", membershipStatus: "ACTIVE" });
  const [message, setMessage] = useState("");
  const [loadingPlan, setLoadingPlan] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>("Orange Money");
  const [mobileAccountName, setMobileAccountName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [receivingAccount, setReceivingAccount] = useState({ accountName: "", accountEmail: "", accountId: "", currency: "USD", settlementBank: "" });

  useEffect(() => {
    fetch("/api/billing/checkout", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setMembership((await response.json()).membership);
    }).catch(() => undefined);

    fetch("/api/payments/account", { cache: "no-store" }).then(async (response) => {
      if (response.ok) {
        setReceivingAccount((await response.json()) as typeof receivingAccount);
      }
    }).catch(() => undefined);
  }, []);

  async function choosePlan(plan: string) {
    if (plan === "FREE") return;
    setSelectedPlan(plan);
    setMessage("");
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;

    setLoadingPlan(selectedPlan);
    setMessage("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
          bankName,
          bankAccountName,
          bankAccountNumber,
          mobileProvider,
          mobileAccountName,
          mobileNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Unable to submit payment details.");
        return;
      }

      if (data.requiresManualVerification) {
        setMessage(data.message || "Your payment details were captured for verification.");
        setSelectedPlan(null);
        return;
      }

      window.location.assign(data.session.url);
    } catch {
      setMessage("Unable to connect to checkout.");
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <main className="min-h-screen bg-[#120d19] text-white">
      <header className="border-b border-white/10 bg-[#180f22]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-black text-rose-300"><Heart className="h-5 w-5 fill-rose-400" />Love Liberia</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-white/70 hover:text-white">Back to dashboard</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-300">Membership</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Choose how you want to connect.</h1><p className="mt-5 text-lg leading-8 text-white/65">Start free, then unlock the tools that make meaningful connections easier.</p></div>
        {message && <div className="mt-8 rounded-xl border border-rose-400/30 bg-rose-950/40 p-4 text-rose-100">{message}</div>}
        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {plans.map((plan) => { const Icon = plan.icon; const active = membership.membershipPlan === plan.id; return <article key={plan.id} className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${plan.featured ? "border-rose-300/70 bg-linear-to-b from-rose-950 to-[#24122f] shadow-2xl shadow-rose-950/40 lg:-translate-y-3" : "border-white/10 bg-white/5"}`}>
            {plan.featured && <div className="absolute right-5 top-5 rounded-full bg-rose-300 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-950">Most popular</div>}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-rose-200"><Icon className="h-6 w-6" /></div>
            <h2 className="mt-6 text-2xl font-black">{plan.name}</h2><p className="mt-2 min-h-14 text-sm leading-6 text-white/60">{plan.description}</p><p className="mt-6 text-3xl font-black">{plan.price}</p>
            <button type="button" onClick={() => void choosePlan(plan.id)} disabled={active || loadingPlan !== ""} className={`mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold ${active ? "bg-white/10 text-white/60" : plan.featured ? "bg-rose-300 text-rose-950 hover:bg-rose-200" : "bg-white text-[#180f22] hover:bg-rose-100"}`}>{loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}{active ? "Current plan" : plan.id === "FREE" ? "Included" : `Choose ${plan.name}`}</button>
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">{plan.features.map((feature) => <p key={feature} className="flex items-start gap-3 text-sm text-white/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{feature}</p>)}</div>
          </article>; })}
        </div>

        {selectedPlan && (
          <form onSubmit={submitPayment} className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-300">Payment details</p>
              <h2 className="mt-3 text-2xl font-black">Choose how you want to pay for {plans.find((plan) => plan.id === selectedPlan)?.name || "this plan"}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all ${paymentMethod === "BANK_TRANSFER" ? "border-rose-300 bg-rose-500/10 shadow-lg shadow-rose-950/30" : "border-white/10 bg-[#180f22] text-white hover:border-white/20 hover:bg-[#1d1526]"}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} className="mt-1 h-4 w-4 accent-rose-400" />
                <span>
                  <span className="block text-base font-black text-white">Bank transfer</span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-rose-200/80">Ecobank / Access / UBA</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all ${paymentMethod === "MOBILE_MONEY" ? "border-rose-300 bg-rose-500/10 shadow-lg shadow-rose-950/30" : "border-white/10 bg-[#180f22] text-white hover:border-white/20 hover:bg-[#1d1526]"}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === "MOBILE_MONEY"} onChange={() => setPaymentMethod("MOBILE_MONEY")} className="mt-1 h-4 w-4 accent-rose-400" />
                <span>
                  <span className="block text-base font-black text-white">Mobile money</span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-rose-200/80">Orange Money / MTN / Lonestar</span>
                </span>
              </label>
            </div>

            {paymentMethod === "BANK_TRANSFER" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-white/80 md:col-span-2">
                  Select a bank account
                  <select value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-2 w-full rounded-xl border border-rose-300/40 bg-[#120d19] px-4 py-3 text-white outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-400/30" required>
                    <option value="">Choose a bank account</option>
                    {bankOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-white/80">
                  Account name
                  <input value={bankAccountName} onChange={(event) => setBankAccountName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-rose-300" placeholder="John Doe" required />
                </label>
                <label className="text-sm font-semibold text-white/80">
                  Account number
                  <input value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-rose-300" placeholder="0123456789" required />
                </label>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-white/80 md:col-span-2">
                  Select mobile money provider
                  <select value={mobileProvider} onChange={(event) => setMobileProvider(event.target.value as MobileMoneyProvider)} className="mt-2 w-full rounded-xl border border-rose-300/40 bg-[#120d19] px-4 py-3 text-white outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-400/30" required>
                    {mobileMoneyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-white/80">
                  Account name
                  <input value={mobileAccountName} onChange={(event) => setMobileAccountName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-rose-300" placeholder="John Doe" required />
                </label>
                <label className="text-sm font-semibold text-white/80">
                  Mobile number
                  <input value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-rose-300" placeholder="+231 88 123 4567" required />
                </label>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-rose-300/40 bg-linear-to-br from-[#1f1328] via-[#180f22] to-[#120d19] p-5 text-sm text-white/80 shadow-xl shadow-rose-950/20">
              <p className="font-black uppercase tracking-[0.22em] text-rose-300">Love Liberia receiving account</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Account name</span><span className="mt-1 block font-semibold text-white">{receivingAccount.accountName || "Not configured yet"}</span></p>
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Email</span><span className="mt-1 block font-semibold text-white">{receivingAccount.accountEmail || "Not configured yet"}</span></p>
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Account ID</span><span className="mt-1 block font-semibold text-white">{receivingAccount.accountId || "Not configured yet"}</span></p>
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Settlement bank</span><span className="mt-1 block font-semibold text-white">{receivingAccount.settlementBank || "Not configured yet"}</span></p>
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Currency</span><span className="mt-1 block font-semibold text-white">{receivingAccount.currency || "USD"}</span></p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedPlan(null)} className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white/80 hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loadingPlan !== ""} className="rounded-xl bg-rose-300 px-5 py-3 font-bold text-rose-950 hover:bg-rose-200 disabled:opacity-60">
                {loadingPlan === selectedPlan ? "Submitting..." : "Submit payment details"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60"><Zap className="h-5 w-5 shrink-0 text-amber-300" />Payments can be completed by bank transfer or mobile money, and the app will request the required details before confirmation.</div>
      </section>
    </main>
  );
}
