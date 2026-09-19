"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";

type User = {
  id: string;
  firstName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  verified: boolean;
  membershipPlan: string;
  createdAt: string;
  reportCount: number;
  reportHistory: {
    id: string;
    reason: string;
    status: "PENDING" | "REVIEWED" | "RESOLVED";
    createdAt: string;
  }[];
  riskFlags: {
    id: string;
    source: string;
    score: number;
    level: string;
    reasons: string;
    status: string;
    createdAt: string;
  }[];
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [verifyingId, setVerifyingId] = useState("");
  const [expandedReportUserId, setExpandedReportUserId] = useState("");
  const [expandedPhotoUserId, setExpandedPhotoUserId] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (roleFilter) params.set("role", roleFilter);
        if (planFilter) params.set("plan", planFilter);
        const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load users.");
          return;
        }

        setUsers(data.users || []);
        setCurrentAdminId(data.currentAdminId || "");
      } catch (loadError) {
        console.error("Load admin users error:", loadError);
        setError("Unable to load users.");
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, [planFilter, roleFilter, search, statusFilter]);

  async function runUserAction(user: User, payload: Record<string, unknown>) {
    setUpdatingId(user.id);
    setError("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, ...payload }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to update account."); return; }
      if (data.deleted) { setUsers((current) => current.filter((item) => item.id !== user.id)); return; }
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item));
    } catch { setError("Unable to update account."); } finally { setUpdatingId(""); }
  }

  async function updateVerification(user: User) {
    setVerifyingId(user.id);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, verified: !user.verified }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update verification status.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, verified: data.user.verified }
            : currentUser
        )
      );
    } catch (updateError) {
      console.error("Update verification status error:", updateError);
      setError("Unable to update verification status.");
    } finally {
      setVerifyingId("");
    }
  }

  async function removePhoto(user: User, photoId: string) {
    setDeletingPhotoId(`${user.id}:${photoId}`);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/photos?photoId=${encodeURIComponent(photoId)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to remove photo.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                photos: currentUser.photos.filter((photo) => photo.id !== photoId),
              }
            : currentUser
        )
      );
    } catch (deleteError) {
      console.error("Remove admin photo error:", deleteError);
      setError("Unable to remove photo.");
    } finally {
      setDeletingPhotoId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link href="/admin" className="text-sm font-bold text-rose-600">
              Admin dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              User management
            </h1>
            <p className="mt-2 text-slate-600">
              Activate or deactivate accounts without deleting member data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/risk"
              className="font-semibold text-amber-700 hover:text-amber-800"
            >
              Risk review
            </Link>
            <Link
              href="/admin/reports"
              className="font-semibold text-rose-600 hover:text-rose-700"
            >
              Safety and moderation
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, or email" className="min-h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-rose-500" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="banned">Banned</option></select>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"><option value="">All roles</option><option value="SUPER_ADMIN">Super Admin</option><option value="ADMIN">Admin</option><option value="MODERATOR">Moderator</option><option value="SUPPORT_AGENT">Support Agent</option><option value="FINANCE_MANAGER">Finance Manager</option><option value="CONTENT_MANAGER">Content Manager</option></select>
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"><option value="">All plans</option><option value="FREE">Free</option><option value="PREMIUM">Premium</option><option value="VIP">VIP</option></select>
        </div>

        <div className="mt-8 overflow-hidden bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-slate-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Reports</th>
                    <th className="px-6 py-4">Photos</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Account control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isAdmin = user.role === "ADMIN";
                    const isCurrentAdmin = user.id === currentAdminId;

                    const reportsExpanded = expandedReportUserId === user.id;
                    const photosExpanded = expandedPhotoUserId === user.id;

                    return (
                      <Fragment key={user.id}>
                      <tr key={user.id}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">
                            {user.firstName}
                            {user.verified && (
                              <span className="ml-2 text-emerald-600">Verified</span>
                            )}
                          </p>
                          <p className="text-slate-500">
                            @{user.username} · {user.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-600">
                          {user.role.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              user.isBanned
                                ? "bg-red-100 text-red-700"
                                : user.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {user.isBanned ? "Banned" : user.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={verifyingId === user.id}
                            onClick={() => void updateVerification(user)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.verified
                                ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {verifyingId === user.id
                              ? "Updating..."
                              : user.verified
                                ? "Unverify"
                                : "Verify"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPhotoUserId(photosExpanded ? "" : user.id)
                            }
                            className="font-bold text-rose-600 hover:text-rose-700"
                          >
                            {user.photos.length} {user.photos.length === 1 ? "photo" : "photos"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedReportUserId(
                                reportsExpanded ? "" : user.id
                              )
                            }
                            className="font-bold text-rose-600 hover:text-rose-700"
                          >
                            {user.reportCount} {user.reportCount === 1 ? "report" : "reports"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {user.riskFlags.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedReportUserId(reportsExpanded ? "" : user.id)}
                              className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"
                            >
                              {user.riskFlags.length} flag{user.riskFlags.length > 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">No flags</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <select value={user.membershipPlan} onChange={(event) => void runUserAction(user, { membershipPlan: event.target.value })} className="rounded-lg border border-slate-300 px-2 py-2 text-xs" aria-label={`Membership plan for ${user.username}`}><option value="FREE">Free</option><option value="PREMIUM">Premium</option><option value="VIP">VIP</option></select>
                            <button type="button" disabled={isAdmin || isCurrentAdmin || updatingId === user.id} onClick={() => void runUserAction(user, { isBanned: !user.isBanned })} className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${user.isBanned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>{updatingId === user.id ? "Updating..." : user.isBanned ? "Unban" : "Ban"}</button>
                            <button type="button" disabled={updatingId === user.id} onClick={() => void runUserAction(user, { action: "reset" })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Reset</button>
                            <button type="button" disabled={isCurrentAdmin || updatingId === user.id} onClick={() => { if (window.confirm(`Delete @${user.username}?`)) void runUserAction(user, { action: "delete" }); }} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                      {reportsExpanded && (
                        <tr key={`${user.id}-reports`} className="bg-slate-50">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="border-l-2 border-rose-300 pl-4">
                              <h3 className="font-bold text-slate-900">
                                Report history for @{user.username}
                              </h3>
                              {user.reportHistory.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">
                                  No reports have been received.
                                </p>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {user.reportHistory.map((report) => (
                                    <div
                                      key={report.id}
                                      className="flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {report.reason}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {new Date(report.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                        {report.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {user.riskFlags.length > 0 && (
                                <div className="mt-5 border-t border-amber-200 pt-4">
                                  <h4 className="font-bold text-amber-800">System risk flags for review</h4>
                                  <div className="mt-3 space-y-2">
                                    {user.riskFlags.map((flag) => (
                                      <div key={flag.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="font-semibold text-amber-900">{flag.source}</p>
                                          <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-bold text-amber-800">{flag.level} · {flag.score}/100</span>
                                        </div>
                                        <p className="mt-1 text-sm text-amber-800">{flag.reasons}</p>
                                        <p className="mt-1 text-xs text-amber-700">{new Date(flag.createdAt).toLocaleString()} · {flag.status}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      {photosExpanded && (
                        <tr key={`${user.id}-photos`} className="bg-slate-50">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="border-l-2 border-sky-300 pl-4">
                              <h3 className="font-bold text-slate-900">
                                Photo moderation for @{user.username}
                              </h3>
                              {user.photos.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">
                                  No uploaded photos.
                                </p>
                              ) : (
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                  {user.photos.map((photo) => (
                                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-200">
                                      <Image
                                        src={photo.url}
                                        alt={`${user.firstName}'s uploaded photo`}
                                        fill
                                        sizes="160px"
                                        className="object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => void removePhoto(user, photo.id)}
                                        disabled={deletingPhotoId === `${user.id}:${photo.id}`}
                                        className="absolute inset-x-2 bottom-2 rounded-md bg-red-600/90 px-2 py-1 text-xs font-bold text-white sm:opacity-0 sm:transition sm:group-hover:opacity-100 disabled:opacity-60"
                                      >
                                        {deletingPhotoId === `${user.id}:${photo.id}`
                                          ? "Removing..."
                                          : photo.isPrimary
                                            ? "Remove profile photo"
                                            : "Remove photo"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}