"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;

  reporter: {
    id: string;
    firstName: string;
    username: string;
    email: string;
  };

  reported: {
    id: string;
    firstName: string;
    username: string;
    email: string;
  };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        setLoading(true);

        const response = await fetch("/api/admin/reports");
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setError(data.error || "Unable to load reports.");
          return;
        }

        setReports(data.reports || []);
        setError("");
      } catch (error) {
        if (cancelled) return;

        console.error("Load reports error:", error);
        setError("Unable to load reports.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Reports
          </h1>

          <p className="mt-2 text-gray-600">
            Review reports submitted by Love Liberia users.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-6 shadow">
            Loading reports...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              No reports
            </h2>

            <p className="mt-2 text-gray-600">
              There are currently no user reports.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl bg-white p-6 shadow"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    {report.status}
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-gray-900">
                    {report.reason}
                  </h2>

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
                  <h3 className="font-semibold text-gray-900">
                    Reporter
                  </h3>

                  <p className="mt-2">
                    {report.reporter.firstName}
                  </p>

                  <p className="text-sm text-gray-500">
                    @{report.reporter.username}
                  </p>

                  <p className="text-sm text-gray-500">
                    {report.reporter.email}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">
                    Reported User
                  </h3>

                  <p className="mt-2">
                    {report.reported.firstName}
                  </p>

                  <p className="text-sm text-gray-500">
                    @{report.reported.username}
                  </p>

                  <p className="text-sm text-gray-500">
                    {report.reported.email}
                  </p>
                </div>
              </div>

              {report.details && (
                <div className="mt-5">
                  <h3 className="font-semibold text-gray-900">
                    Additional Details
                  </h3>

                  <p className="mt-2 rounded-lg bg-gray-50 p-4 text-gray-700">
                    {report.details}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}