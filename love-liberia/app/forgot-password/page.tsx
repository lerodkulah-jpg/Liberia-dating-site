"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : null;
      if (!response.ok) {
        setMessage(result?.error || `The server could not process the request (${response.status}).`);
        return;
      }
      setMessage(result?.message || "Unable to request a reset link.");
      if (result?.developmentResetUrl) setResetUrl(result.developmentResetUrl);
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:p-8">
        <h1 className="text-3xl font-black">Reset your password</h1>
        <p className="mt-3 text-gray-300">Enter your email and we will send a secure reset link if an account exists.</p>
        <label className="mt-7 block text-sm font-bold" htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-600 bg-gray-950 px-4 text-white outline-none focus:border-red-500" />
        <button disabled={loading} type="submit" className="mt-6 min-h-12 w-full rounded-full bg-red-600 px-4 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading ? "Requesting link..." : "Send reset link"}</button>
        {message && <p className="mt-5 text-sm text-gray-200">{message}</p>}
        {resetUrl && <Link href={resetUrl} className="mt-4 block break-all rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm font-semibold text-amber-200">Open development reset link</Link>}
        <p className="mt-7 text-sm text-gray-300"><Link href="/login" className="font-bold text-red-400 hover:underline">Back to sign in</Link></p>
      </form>
    </main>
  );
}
