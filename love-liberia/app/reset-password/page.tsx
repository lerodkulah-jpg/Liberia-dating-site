"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      setMessage(result.message || result.error || "Unable to reset your password.");
      setSuccess(response.ok);
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:p-8">
      <h1 className="text-3xl font-black">Choose a new password</h1>
      <p className="mt-3 text-gray-300">Your new password must contain at least 8 characters.</p>
      <label className="mt-7 block text-sm font-bold" htmlFor="password">New password</label>
      <input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-600 bg-gray-950 px-4 text-white outline-none focus:border-red-500" />
      <label className="mt-5 block text-sm font-bold" htmlFor="confirmation">Confirm password</label>
      <input id="confirmation" type="password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-600 bg-gray-950 px-4 text-white outline-none focus:border-red-500" />
      <button disabled={loading || !token} type="submit" className="mt-6 min-h-12 w-full rounded-full bg-red-600 px-4 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading ? "Updating password..." : "Update password"}</button>
      {message && <p className={`mt-5 text-sm ${success ? "text-emerald-300" : "text-red-300"}`}>{message}</p>}
      {success && <Link href="/login" className="mt-5 block font-bold text-red-400 hover:underline">Sign in with your new password</Link>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white"><Suspense fallback={<p>Loading reset form...</p>}><ResetPasswordForm /></Suspense></main>;
}
