"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const faqs = [
  { question: "How do I update my profile?", answer: "Open Profile, choose Edit Profile, update your details, and save your changes. You can also control visibility, messaging, online status, and incognito mode there." },
  { question: "How do I block or report someone?", answer: "Use the Block or Report controls on a profile or conversation. Blocking removes the connection from your discovery and messaging paths. Reports are reviewed by the Love Liberia moderation team." },
  { question: "How do I keep my account safe?", answer: "Never send money to someone you have met online, keep conversations on Love Liberia while trust develops, verify who you are speaking with, and report suspicious requests." },
  { question: "How do I change who can message me?", answer: "Go to Privacy & data settings and choose Everyone or Matches only under Who can message you." },
  { question: "How do I export or delete my data?", answer: "Open Privacy & data settings. You can download your account data or permanently delete your account after entering the confirmation phrase." },
  { question: "Why can I not send a message?", answer: "The other member may allow messages from matches only, or there may be an active block. Make sure both accounts are active and eligible to communicate." },
];

const helpArticles = [
  ["Getting started", "Complete your profile, add a clear photo, set your preferences, and use Discover to find compatible people."],
  ["Dating safely", "Keep personal information private, watch for money requests, and arrange first meetings in public places."],
  ["Privacy controls", "Choose who can see your activity, appear in recommendations, message you, or view your visits."],
  ["Account and billing", "Review memberships, credits, purchases, and account data from your dashboard and privacy settings."],
];

type Ticket = { id: string; subject: string; description: string; status: string; priority: string; createdAt: string };

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTickets() {
      const response = await fetch("/api/support", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setTickets(data.tickets || []);
    }
    void loadTickets();
  }, []);

  const visibleFaqs = useMemo(() => faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(query.toLowerCase())), [query]);

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, description, priority }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to contact support."); return; }
      setTickets((current) => [data.ticket, ...current]);
      setSubject(""); setDescription(""); setPriority("NORMAL"); setMessage("Your support ticket was submitted.");
    } catch { setError("Unable to contact support right now."); } finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/dashboard" className="text-sm font-bold text-rose-600">Back to dashboard</Link><p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-rose-600">Love Liberia Support Center</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">How can we help?</h1><p className="mt-4 max-w-2xl text-lg text-slate-600">Find answers, read help articles, or contact the support team about your account.</p></div><Link href="/safety" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Safety Center</Link></div>

    <div className="mt-8"><label htmlFor="support-search" className="sr-only">Search support questions</label><input id="support-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FAQs and help topics" className="min-h-13 w-full rounded-2xl border border-slate-200 bg-white px-5 shadow-sm outline-none focus:border-rose-400" /></div>

    <section id="faqs" className="mt-10 grid scroll-mt-6 gap-8 lg:grid-cols-[1.1fr_0.9fr]"><div><h2 className="text-2xl font-black">Frequently asked questions</h2><div className="mt-4 space-y-3">{visibleFaqs.map((faq, index) => <div key={faq.question} className="rounded-xl border border-slate-200 bg-white"><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold"><span>{faq.question}</span><span className="text-xl text-rose-600">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p className="border-t border-slate-100 px-5 pb-5 pt-4 leading-7 text-slate-600">{faq.answer}</p>}</div>)}</div>{visibleFaqs.length === 0 && <p className="mt-4 text-slate-500">No matching questions. Contact support below.</p>}</div><div><h2 className="text-2xl font-black">Help articles</h2><div className="mt-4 grid gap-3">{helpArticles.map(([title, text]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-black text-rose-700">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>

    <section className="mt-12 grid scroll-mt-6 gap-8 lg:grid-cols-[1fr_0.8fr]"><form id="contact-support" onSubmit={submitTicket} className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Contact support</h2><p className="mt-2 text-slate-600">Tell us what happened and our team will review your ticket.</p>{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-5 space-y-4"><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" maxLength={160} required className="min-h-12 w-full rounded-lg border border-slate-300 px-3" /><select value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 px-3"><option value="LOW">Low priority</option><option value="NORMAL">Normal priority</option><option value="HIGH">High priority</option></select><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your question or issue" maxLength={5000} rows={7} required className="w-full rounded-lg border border-slate-300 p-3" /><button disabled={saving} className="min-h-12 rounded-lg bg-rose-600 px-5 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-50">{saving ? "Submitting..." : "Submit support ticket"}</button></div></form><div id="report-problem" className="scroll-mt-6"><h2 className="text-2xl font-black">Report an issue</h2><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6"><p className="leading-7 text-amber-950">For fake profiles, harassment, scams, threats, or unsafe behavior, use the in-app Report button so moderators receive the member and context details.</p><Link href="/safety" className="mt-5 inline-flex rounded-lg bg-amber-700 px-4 py-3 font-bold text-white">Open Safety Center</Link></div><h2 className="mt-8 text-2xl font-black">Your tickets</h2><div className="mt-4 space-y-3">{tickets.length === 0 ? <p className="text-slate-500">Your submitted tickets will appear here.</p> : tickets.map((ticket) => <article key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><h3 className="font-bold">{ticket.subject}</h3><span className="text-xs font-black uppercase text-rose-600">{ticket.status}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-600">{ticket.description}</p><p className="mt-3 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()} · {ticket.priority}</p></article>)}</div></div></section></div></main>;
}
