"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, X } from "lucide-react";

type Submission = {
  id: string;
  userId: string;
  createdAt: string;
  photoMimeType: string | null;
  user: {
    firstName: string;
    username: string;
    profileImage: string | null;
    profilePhotos: { id: string; url: string }[];
  };
};

export default function PhotoVerificationQueuePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/verifications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load verification requests.");
        if (active) setSubmissions(data.submissions || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load verification requests.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function review(submission: Submission, decision: "APPROVE" | "REJECT") {
    setProcessingId(submission.id);
    setError("");
    try {
      const response = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: submission.id, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review this selfie.");
      setSubmissions((current) => current.filter((item) => item.id !== submission.id));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review this selfie.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm font-bold text-rose-700">Admin dashboard</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-b border-slate-300 pb-5">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Member safety</p>
            <h1 className="mt-1 text-3xl font-black">Photo verification review</h1>
          </div>
          <span className="text-sm font-semibold text-slate-600">{submissions.length} pending</span>
        </div>

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {loading ? (
          <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-rose-600" /></div>
        ) : submissions.length === 0 ? (
          <p className="py-12 text-center text-slate-600">No pending photo verification requests.</p>
        ) : (
          <div className="divide-y divide-slate-300">
            {submissions.map((submission) => {
              const profilePhotos = [
                ...(submission.user.profileImage ? [{ id: "primary", url: submission.user.profileImage }] : []),
                ...submission.user.profilePhotos,
              ];
              const busy = processingId === submission.id;
              return (
                <article key={submission.id} className="py-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{submission.user.firstName} <span className="font-normal text-slate-600">@{submission.user.username}</span></h2>
                      <p className="mt-1 text-sm text-slate-500">Submitted {new Date(submission.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy || profilePhotos.length === 0} onClick={() => void review(submission, "APPROVE")} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50"><BadgeCheck className="h-4 w-4" />{busy ? "Saving..." : "Approve"}</button>
                      <button type="button" disabled={busy} onClick={() => void review(submission, "REJECT")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-800 disabled:opacity-50"><X className="h-4 w-4" />Reject</button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                    <div>
                      <h3 className="mb-2 text-sm font-bold">Submitted selfie</h3>
                      <div className="relative aspect-4/5 max-h-128 overflow-hidden bg-slate-200">
                        <Image src={`/api/admin/verifications/${encodeURIComponent(submission.id)}/photo`} alt={`Verification selfie from ${submission.user.firstName}`} fill unoptimized className="object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-bold">Current profile photos</h3>
                      {profilePhotos.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {profilePhotos.map((photo) => <div key={photo.id} className="relative aspect-square overflow-hidden bg-slate-200"><Image src={photo.url} alt={`${submission.user.firstName}'s profile photo`} fill unoptimized className="object-cover" /></div>)}
                        </div>
                      ) : <p className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">No profile photos to compare. Approval is disabled.</p>}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">Approve only when the selfie shows the requested code and the same person as at least one current profile photo. This is a human photo comparison, not government identity verification.</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}