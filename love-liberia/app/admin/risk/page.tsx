"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RiskFlag = {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  email: string;
  source: string;
  score: number;
  level: string;
  reasons: string;
  notes: string | null;
  status: string;
  createdAt: string;
};

export default function AdminRiskPage() {
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState("");

  useEffect(() => {
    async function loadFlags() {
      try {
        const response = await fetch("/api/admin/risk", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Unable to load risk review queue.");
          return;
        }
        setFlags(data.flags || []);
      } catch (loadError) {
        console.error("Load risk flags error:", loadError);
        setError("Unable to load risk review queue.");
      } finally {
        setLoading(false);
      }
    }

    void loadFlags();
  }, []);

  async function updateFlag(flagId: string, action: "dismiss" | "escalate") {
    setActioningId(flagId);
    setError("");
    try {
      const response = await fetch("/api/admin/risk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update risk flag.");
        return;
      }

      setFlags((currentFlags) => currentFlags.filter((flag) => flag.id !== flagId));
    } catch (updateError) {
      console.error("Update risk flag error:", updateError);
      setError("Unable to update risk flag.");
    } finally {
      setActioningId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-rose-600">Admin dashboard</Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Risk review queue</h1>
            <p className="mt-2 text-slate-600">Flagged accounts are reviewed by humans before any action is taken.</p>
          </div>
          <Link href="/admin/users" className="font-semibold text-amber-700 hover:text-amber-800">Back to users</Link>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-slate-500">Loading risk flags...</p>
          ) : flags.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-bold text-slate-900">No active risk flags</p>
              <p className="mt-2 text-slate-500">The moderation queue is clear at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Reasons</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flags.map((flag) => (
                    <tr key={flag.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{flag.firstName}</p>
                        <p className="text-slate-500">@{flag.username}</p>
                        <p className="text-xs text-slate-500">{flag.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{flag.source}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                          flag.level === "critical" ? "bg-red-100 text-red-700" :
                          flag.level === "high" ? "bg-orange-100 text-orange-700" :
                          flag.level === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {flag.level} · {flag.score}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md text-slate-700">{flag.reasons}</td>
                      <td className="px-6 py-4 max-w-sm text-slate-600">{flag.notes || "No extra notes."}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(flag.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={actioningId === flag.id}
                            onClick={() => void updateFlag(flag.id, "dismiss")}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {actioningId === flag.id ? "Processing..." : "Dismiss"}
                          </button>
                          <button
                            type="button"
                            disabled={actioningId === flag.id}
                            onClick={() => void updateFlag(flag.id, "escalate")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {actioningId === flag.id ? "Escalating..." : "Escalate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
