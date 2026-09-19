"use client";

import { useEffect, useState } from "react";

type SafetyActionsProps = {
  userId: string;
  userName: string;
};

const reportReasons = [
  "Fake profile",
  "Scam",
  "Harassment",
  "Hate speech",
  "Sexual content",
  "Spam",
  "Threats",
  "Impersonation",
  "Underage user",
  "Other",
];

export default function SafetyActions({
  userId,
  userName,
}: SafetyActionsProps) {
  const [blocked, setBlocked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchBlockStatus() {
      try {
        const response = await fetch(
          `/api/blocks?userId=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setBlocked(Boolean(data.blocked));
      } catch (error) {
        console.error("Unable to check block status:", error);
      }
    }

    void fetchBlockStatus();
  }, [userId]);

  async function handleBlock() {
    const confirmed = window.confirm(
      blocked
        ? `Unblock ${userName}?`
        : `Are you sure you want to block ${userName}?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/blocks", {
        method: blocked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blockedId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setBlocked(!blocked);
      setMessage(data.message || "Action completed.");
    } catch (error) {
      console.error("Block action error:", error);
      setMessage("Unable to complete this action.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHide() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/hidden-profiles", {
        method: hidden ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiddenId: userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Unable to update hidden profile.");
        return;
      }
      setHidden(!hidden);
      setMessage(hidden ? `${userName} will appear in recommendations again.` : `${userName} is hidden from recommendations.`);
    } catch {
      setMessage("Unable to update hidden profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReport(event: React.FormEvent) {
    event.preventDefault();

    if (!reason) {
      setMessage("Please select a reason.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedId: userId,
          reason,
          details,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to submit report.");
        return;
      }

      setMessage("Report submitted successfully.");
      setReason("");
      setDetails("");
      setShowReport(false);
    } catch (error) {
      console.error("Report error:", error);
      setMessage("Unable to submit report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBlock}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : blocked
              ? "Unblock"
              : "Block"}
        </button>

        <button
          type="button"
          onClick={() => void handleHide()}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hidden ? "Show again" : "Hide profile"}
        </button>

        <button
          type="button"
          onClick={() => setShowReport(!showReport)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Report
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-gray-600">
          {message}
        </p>
      )}

      {showReport && (
        <form
          onSubmit={handleReport}
          className="mt-4 rounded-xl border bg-gray-50 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold">
            Report {userName}
          </h3>

          <label className="mb-2 block text-sm font-medium">
            Reason
          </label>

          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select a reason</option>

            {reportReasons.map((reportReason) => (
              <option
                key={reportReason}
                value={reportReason}
              >
                {reportReason}
              </option>
            ))}
          </select>

          <label className="mb-2 mt-4 block text-sm font-medium">
            Additional details
          </label>

          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Tell us what happened..."
            rows={4}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>

            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}