"use client";

import { Heart, Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to sign in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-6 sm:px-5 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
            <Heart size={28} className="fill-white text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-gray-300">Sign in to your Love Liberia account.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-7">
          <label className="mb-2 block text-sm font-bold text-white" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 min-w-0 w-full rounded-xl border border-gray-600 bg-gray-950 py-3 pl-11 pr-4 text-white placeholder:text-white/60 outline-none focus:border-red-500" />
          </div>

          <label className="mb-2 mt-5 block text-sm font-bold text-white" htmlFor="password">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="min-h-12 min-w-0 w-full rounded-xl border border-gray-600 bg-gray-950 py-3 pl-11 pr-4 text-white placeholder:text-white/60 outline-none focus:border-red-500" />
          </div>

          <button disabled={loading} type="submit" className="mt-6 w-full rounded-full bg-red-600 py-4 font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{loading ? "Signing in..." : "Sign In"}</button>
          {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
          <p className="mt-6 text-center text-sm text-gray-300">Don&apos;t have an account? <a href="/register" className="font-bold text-red-400 hover:underline">Create one</a></p>
        </form>
      </div>
    </main>
  );
}
