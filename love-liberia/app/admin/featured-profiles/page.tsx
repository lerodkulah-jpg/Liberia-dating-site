"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type FeatureRequest = {
  id: string;
  firstName: string;
  username: string;
  county: string | null;
  city: string | null;
  occupation: string | null;
  bio: string | null;
  profileImage: string | null;
  profileVisibility: string;
  featuredRequestedAt: string | null;
  isActive: boolean;
  isBanned: boolean;
};

export default function AdminFeaturedProfilesPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRequests() {
      setError("");
      try {
        const response = await fetch("/api/admin/featured-profiles", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load feature requests.");
        if (active) setRequests(data.requests || []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load feature requests.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRequests();
    return () => {
      active = false;
    };
  }, []);

  async function reviewRequest(userId: string, action: "approve" | "reject") {
    setUpdatingId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/featured-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review feature request.");
      setRequests((current) => current.filter((request) => request.id !== userId));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review feature request.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Featured profile requests</h1>
        <p className="mt-2 text-gray-600">Approve only members who explicitly requested a public homepage feature and have a public profile.</p>

        {loading && <div className="mt-8 rounded-xl bg-white p-6 shadow">Loading requests...</div>}
        {error && <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>}
        {!loading && !error && requests.length === 0 && <div className="mt-8 rounded-xl bg-white p-8 text-center text-gray-600 shadow">There are no pending feature requests.</div>}

        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const eligible = request.profileVisibility === "PUBLIC" && request.isActive && !request.isBanned;
            return (
              <article key={request.id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex flex-col gap-5 sm:flex-row">
                  {request.profileImage ? (
                    <Image src={request.profileImage} alt="" width={96} height={96} unoptimized className="h-24 w-24 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-rose-100 text-3xl font-bold text-rose-700">{request.firstName.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{request.firstName} <span className="text-sm font-normal text-gray-500">@{request.username}</span></h2>
                    <p className="mt-1 text-sm text-gray-600">{[request.city, request.county].filter(Boolean).join(", ") || "Location not specified"}{request.occupation ? ` · ${request.occupation}` : ""}</p>
                    <p className="mt-3 whitespace-pre-wrap text-gray-700">{request.bio || "No bio provided."}</p>
                    <p className="mt-3 text-xs text-gray-500">Requested {request.featuredRequestedAt ? new Date(request.featuredRequestedAt).toLocaleString() : "date unavailable"}</p>
                    {!eligible && <p className="mt-2 text-sm font-semibold text-amber-700">Not eligible for homepage display: profile must be public and active.</p>}
                  </div>
                  <div className="flex shrink-0 gap-3 sm:flex-col">
                    <button type="button" onClick={() => void reviewRequest(request.id, "approve")} disabled={!eligible || updatingId === request.id} className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{updatingId === request.id ? "Saving..." : "Approve"}</button>
                    <button type="button" onClick={() => void reviewRequest(request.id, "reject")} disabled={updatingId === request.id} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
