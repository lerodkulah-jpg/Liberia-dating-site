"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  action: string | null;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  createdAt: string;
  reporter: { firstName: string; username: string; email: string };
  reported: { firstName: string; username: string; email: string };
  auditLog: { id: string; action: string; notes: string | null; createdAt: string }[];
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/api/admin/reports");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load reports.");
          return;
        }

        setReports(data.reports || []);
      } catch (loadError) {
        console.error("Load reports error:", loadError);
        setError("Unable to load reports.");
      } finally {
        setLoading(false);
      }
    }

    void loadReports();
  }, []);

  async function updateReportStatus(reportId: string, action: string) {
    setUpdatingId(reportId);
    setError("");

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update report status.");
        return;
      }

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === reportId
            ? { ...report, status: data.report.status, action: data.report.action }
            : report
        )
      );
    } catch (updateError) {
      console.error("Update report status error:", updateError);
      setError("Unable to update report status.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
        <p className="mt-2 text-gray-600">
          Review reports submitted by Love Liberia users.
        </p>

        {loading && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            Loading reports...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold text-gray-900">No reports</h2>
            <p className="mt-2 text-gray-600">
              There are currently no user reports.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {reports.map((report) => (
            <article key={report.id} className="rounded-xl bg-white p-6 shadow">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    report.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : report.status === "REVIEWED"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {report.status}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-gray-900">
                    {report.reason}
                  </h2>
                  {report.details && <p className="mt-2 max-w-2xl text-sm text-gray-600">{report.details}</p>}
                  <p className="mt-2 text-sm text-gray-500">
                    Report ID: {report.id}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">Reporter</h3>
                  <p className="mt-2">{report.reporter.firstName}</p>
                  <p className="text-sm text-gray-500">
                    @{report.reporter.username}
                  </p>
                  <p className="text-sm text-gray-500">{report.reporter.email}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">Reported User</h3>
                  <p className="mt-2">{report.reported.firstName}</p>
                  <p className="text-sm text-gray-500">
                    @{report.reported.username}
                  </p>
                  <p className="text-sm text-gray-500">{report.reported.email}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  disabled={updatingId === report.id || report.status === "REVIEWED"}
                  onClick={() => void updateReportStatus(report.id, "REVIEW")}
                  className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Review
                </button>
                <button
                  type="button"
                  disabled={updatingId === report.id || report.status === "RESOLVED"}
                  onClick={() => void updateReportStatus(report.id, "WARN")}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Warn
                </button>
                <button
                  type="button"
                  disabled={updatingId === report.id || report.status === "PENDING"}
                  onClick={() => void updateReportStatus(report.id, "SUSPEND")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suspend
                </button>
                <button type="button" disabled={updatingId === report.id} onClick={() => void updateReportStatus(report.id, "BAN")} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">Ban</button>
                <button type="button" disabled={updatingId === report.id} onClick={() => void updateReportStatus(report.id, "REMOVE_CONTENT")} className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-40">Remove content</button>
                <button type="button" disabled={updatingId === report.id} onClick={() => void updateReportStatus(report.id, "CLOSE")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">Close report</button>
              </div>
              {report.auditLog.length > 0 && <div className="mt-5 border-t border-gray-100 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Audit log</p><div className="mt-2 space-y-1">{report.auditLog.map((entry) => <p key={entry.id} className="text-xs text-gray-500">{entry.action} · {new Date(entry.createdAt).toLocaleString()}{entry.notes ? ` · ${entry.notes}` : ""}</p>)}</div></div>}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}