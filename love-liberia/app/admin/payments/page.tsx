"use client";

import { useEffect, useState } from "react";

type PaymentEntry = {
  id: string;
  amountCents: number;
  currency: string;
  provider: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    username: string;
    email: string;
    phone?: string | null;
  };
  subscription?: {
    id: string;
    plan: string;
    status: string;
  } | null;
};

type CreditPurchaseEntry = {
  id: string;
  type: string;
  credits: number;
  amountCents: number;
  status: string;
  providerReference: string | null;
  createdAt: string;
  user: PaymentEntry["user"] | null;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch("/api/admin/payments");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load payments.");
          return;
        }

        setPayments(data.pendingManualPayments || []);
        setCreditPurchases(data.pendingCreditPurchases || []);
      } catch (loadError) {
        console.error("Load payments error:", loadError);
        setError("Unable to load pending payment reviews.");
      } finally {
        setLoading(false);
      }
    }

    void loadPayments();
  }, []);

  async function updatePayment(paymentId: string, action: "APPROVE" | "REJECT") {
    setProcessingId(paymentId);
    setError("");

    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update payment status.");
        return;
      }

      setPayments((current) => current.filter((entry) => entry.id !== paymentId));
    } catch (updateError) {
      console.error("Update payment error:", updateError);
      setError("Unable to update payment review.");
    } finally {
      setProcessingId("");
    }
  }

  async function updateCreditPurchase(creditTransactionId: string, action: "APPROVE" | "REJECT") {
    const processingKey = `credit-${creditTransactionId}`;
    setProcessingId(processingKey);
    setError("");

    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditTransactionId, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to update credit purchase.");
        return;
      }
      setCreditPurchases((current) => current.filter((entry) => entry.id !== creditTransactionId));
    } catch (updateError) {
      console.error("Update credit purchase error:", updateError);
      setError("Unable to update credit purchase.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Finance</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Manual payment reviews</h1>
          </div>
          <a href="/admin" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Back to dashboard
          </a>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">Loading manual payments...</div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && payments.length === 0 && creditPurchases.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">No pending payments</h2>
            <p className="mt-2 text-slate-600">Bank transfers, mobile money, and wallet credit purchases will appear here for review.</p>
          </div>
        )}

        {creditPurchases.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black">Wallet credit purchases</h2>
            <div className="space-y-4">
              {creditPurchases.map((purchase) => {
                const processingKey = `credit-${purchase.id}`;
                const isMobileMoney = purchase.providerReference?.startsWith("manual_mobile_");
                return (
                  <article key={purchase.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-700">{purchase.status} · {isMobileMoney ? "Mobile money" : "Bank transfer"}</span>
                        <h3 className="mt-2 text-xl font-black">{purchase.type.replace(/_/g, " ")}</h3>
                        <p className="mt-1 text-sm text-slate-600">{purchase.credits} credits · Submitted {new Date(purchase.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="text-right text-xl font-black">USD {(purchase.amountCents / 100).toFixed(2)}</p>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                      {purchase.user ? <><span className="font-bold text-slate-900">{purchase.user.firstName} (@{purchase.user.username})</span><span className="ml-2">{purchase.user.email}</span>{purchase.user.phone && <span className="ml-2">{purchase.user.phone}</span>}</> : "Member account no longer exists"}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" disabled={!purchase.user || processingId === processingKey} onClick={() => void updateCreditPurchase(purchase.id, "APPROVE")} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{processingId === processingKey ? "Approving..." : "Approve and add credits"}</button>
                      <button type="button" disabled={processingId === processingKey} onClick={() => void updateCreditPurchase(purchase.id, "REJECT")} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Reject</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {payments.length > 0 && <section className="space-y-5">
          <h2 className="text-xl font-black">Membership payments</h2>
          {payments.map((payment) => (
            <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                    {payment.status}
                  </span>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    {payment.provider === "BANK_TRANSFER" ? "Bank transfer" : "Mobile money"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Submitted on {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Amount</p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {payment.currency} {(payment.amountCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Member</p>
                  <p className="mt-2 font-bold text-slate-900">{payment.user.firstName}</p>
                  <p className="text-sm text-slate-600">@{payment.user.username}</p>
                  <p className="text-sm text-slate-600">{payment.user.email}</p>
                  <p className="text-sm text-slate-600">{payment.user.phone || "No phone number provided"}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Subscription</p>
                  <p className="mt-2 font-bold text-slate-900">{payment.subscription?.plan || "Unknown plan"}</p>
                  <p className="text-sm text-slate-600">Status: {payment.subscription?.status || "Unknown"}</p>
                  <p className="text-sm text-slate-600">ID: {payment.subscription?.id || payment.id}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={processingId === payment.id}
                  onClick={() => void updatePayment(payment.id, "APPROVE")}
                  className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processingId === payment.id ? "Approving..." : "Approve payment"}
                </button>
                <button
                  type="button"
                  disabled={processingId === payment.id}
                  onClick={() => void updatePayment(payment.id, "REJECT")}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject payment
                </button>
              </div>
            </article>
          ))}
        </section>}
      </div>
    </main>
  );
}
