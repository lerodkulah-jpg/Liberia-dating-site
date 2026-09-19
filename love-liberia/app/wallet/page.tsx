"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Gift, Loader2, RefreshCcw, Rocket, Star, WalletCards } from "lucide-react";

const productMeta = {
  BOOST: { icon: Rocket, label: "Profile Boost" },
  SUPER_LIKES: { icon: Star, label: "Super Likes" },
  REWINDS: { icon: RefreshCcw, label: "Rewinds" },
  GIFTS: { icon: Gift, label: "Virtual Gifts" },
} as const;

type Product = { label: string; description: string; credits: number; amountCents: number };
type Transaction = { id: string; type: string; credits: number; amountCents: number; status: string; createdAt: string };
type PaymentMethod = "BANK_TRANSFER" | "MOBILE_MONEY";
type MobileMoneyProvider = "Orange Money" | "MTN Mobile Money" | "Lonestar Cell" | "Other";

const mobileMoneyOptions: MobileMoneyProvider[] = ["Orange Money", "MTN Mobile Money", "Lonestar Cell", "Other"];
const bankOptions = ["Ecobank Liberia", "Access Bank Liberia", "United Bank for Africa (UBA)", "Other bank account"];

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>("Orange Money");
  const [mobileAccountName, setMobileAccountName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [receivingAccount, setReceivingAccount] = useState({ accountName: "", accountEmail: "", accountId: "", settlementBank: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshWallet() {
    const response = await fetch("/api/wallet", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load wallet.");
    setBalance(data.wallet.balance);
    setProducts(data.products);
    setTransactions(data.transactions);
  }

  useEffect(() => {
    refreshWallet().catch((reason: Error) => setError(reason.message));
    fetch("/api/payments/account", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setReceivingAccount(await response.json());
    }).catch(() => undefined);
  }, []);

  async function purchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setLoadingProduct(selectedProduct);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: selectedProduct, paymentMethod, bankName, bankAccountName, bankAccountNumber, mobileProvider, mobileAccountName, mobileNumber }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to purchase credits.");
      setMessage(data.message);
      await refreshWallet();
      setSelectedProduct(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect to checkout.");
    } finally {
      setLoadingProduct("");
    }
  }

  return (
    <main className="min-h-screen bg-[#100d18] text-white">
      <header className="border-b border-white/10 bg-[#171122]"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/dashboard" className="flex items-center gap-2 text-rose-300"><ArrowLeft className="h-5 w-5" />Dashboard</Link><div className="flex items-center gap-2 font-black text-rose-300"><WalletCards className="h-5 w-5" />Wallet</div><Link href="/membership" className="text-sm font-semibold text-white/70 hover:text-white">Membership</Link></div></header>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-300">Love Liberia credits</p><h1 className="mt-3 text-4xl font-black">Power your next connection.</h1><p className="mt-3 text-white/60">Use credits for boosts, Super Likes, rewinds, and gifts.</p></div><div className="rounded-2xl border border-rose-300/30 bg-rose-950/40 px-6 py-5"><p className="text-sm text-white/60">Current credits</p><p className="mt-1 text-4xl font-black text-rose-200">{balance.toLocaleString()}</p></div></div>
        {message && <div className="mt-7 rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-4 text-emerald-200">{message}</div>}
        {error && <div className="mt-7 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">{error}</div>}
        <h2 className="mt-12 text-2xl font-black">Purchase credits</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(products).map(([key, product]) => { const meta = productMeta[key as keyof typeof productMeta]; const Icon = meta.icon; return <article key={key} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-rose-200"><Icon className="h-5 w-5" /></div><span className="text-sm font-black text-rose-200">{product.credits} credits</span></div><h3 className="mt-5 text-xl font-black">{product.label || meta.label}</h3><p className="mt-2 min-h-12 text-sm text-white/60">{product.description}</p><p className="mt-5 text-2xl font-black">${(product.amountCents / 100).toFixed(2)}</p><button type="button" onClick={() => { setSelectedProduct(key); setMessage(""); setError(""); }} disabled={loadingProduct !== ""} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-300 px-4 py-3 font-bold text-rose-950 hover:bg-rose-200 disabled:opacity-60">{loadingProduct === key && <Loader2 className="h-4 w-4 animate-spin" />}Buy credits</button></article>; })}</div>
        {selectedProduct && <form onSubmit={purchase} className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"><p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-300">Payment details</p><h2 className="mt-3 text-2xl font-black">Pay for {products[selectedProduct]?.label || "credits"}</h2><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#180f22] p-4"><input type="radio" name="paymentMethod" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} className="mt-1 h-4 w-4 accent-rose-400" /><span><span className="block font-black">Bank transfer</span><span className="mt-1 block text-xs text-rose-200/80">Ecobank / Access / UBA</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#180f22] p-4"><input type="radio" name="paymentMethod" checked={paymentMethod === "MOBILE_MONEY"} onChange={() => setPaymentMethod("MOBILE_MONEY")} className="mt-1 h-4 w-4 accent-rose-400" /><span><span className="block font-black">Mobile money</span><span className="mt-1 block text-xs text-rose-200/80">Orange Money / MTN / Lonestar</span></span></label></div>
          {paymentMethod === "BANK_TRANSFER" ? <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold md:col-span-2">Select a bank account<select value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-2 w-full rounded-xl border border-rose-300/40 bg-[#120d19] px-4 py-3 text-white" required><option value="">Choose a bank account</option>{bankOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><label className="text-sm font-semibold">Account name<input value={bankAccountName} onChange={(event) => setBankAccountName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white" required /></label><label className="text-sm font-semibold">Account number<input value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white" required /></label></div> : <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold md:col-span-2">Select mobile money provider<select value={mobileProvider} onChange={(event) => setMobileProvider(event.target.value as MobileMoneyProvider)} className="mt-2 w-full rounded-xl border border-rose-300/40 bg-[#120d19] px-4 py-3 text-white" required>{mobileMoneyOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><label className="text-sm font-semibold">Account name<input value={mobileAccountName} onChange={(event) => setMobileAccountName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white" required /></label><label className="text-sm font-semibold">Mobile number<input value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d19] px-4 py-3 text-white" required /></label></div>}
          <div className="mt-6 rounded-2xl border border-rose-300/40 bg-[#1f1328] p-5 text-sm"><p className="font-black uppercase tracking-[0.22em] text-rose-300">Love Liberia receiving account</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><p>Account name: <strong>{receivingAccount.accountName || "Not configured yet"}</strong></p><p>Email: <strong>{receivingAccount.accountEmail || "Not configured yet"}</strong></p><p>Account ID: <strong>{receivingAccount.accountId || "Not configured yet"}</strong></p><p>Settlement bank: <strong>{receivingAccount.settlementBank || "Not configured yet"}</strong></p></div></div>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSelectedProduct(null)} className="rounded-xl border border-white/10 px-5 py-3 font-semibold">Cancel</button><button type="submit" disabled={loadingProduct !== ""} className="rounded-xl bg-rose-300 px-5 py-3 font-bold text-rose-950 disabled:opacity-60">{loadingProduct === selectedProduct ? "Submitting..." : "Submit payment details"}</button></div>
        </form>}
        <h2 className="mt-12 text-2xl font-black">Recent activity</h2><div className="mt-4 space-y-3">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><span>{transaction.credits} credits</span><span className="text-white/50">{transaction.status}</span></div>)}</div>
      </section>
    </main>
  );
}
