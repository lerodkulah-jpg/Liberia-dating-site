"use client";

import { Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "email-otp">("password");
  const [otpRequested, setOtpRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestEmailOtp() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Unable to send a sign-in code.");
        return;
      }

      setOtpRequested(true);
      setMessage(result.developmentCode ? `Development code: ${result.developmentCode}` : result.message);
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginMethod === "email-otp" && !otpRequested) {
      await requestEmailOtp();
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const isEmailOtp = loginMethod === "email-otp";
      const response = await fetch(isEmailOtp ? "/api/auth/email-otp" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEmailOtp ? { action: "verify", email, code } : { email, password }),
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
    <main className="login-shell flex min-h-screen items-center justify-center px-4 py-6 sm:px-5 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-2 ring-red-400/70 ring-offset-2 ring-offset-gray-950">
            <img src="/icon.svg" alt="Love Liberia logo" className="h-14 w-14 rounded-full object-cover" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-black sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm font-medium text-black sm:text-base">Sign in to your Love Liberia account and keep connecting.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-7">
          <div role="tablist" aria-label="Sign-in method" className="mb-5 grid grid-cols-2 rounded-xl bg-gray-950 p-1">
            <button type="button" role="tab" aria-selected={loginMethod === "password"} onClick={() => { setLoginMethod("password"); setOtpRequested(false); setCode(""); setMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMethod === "password" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>Password</button>
            <button type="button" role="tab" aria-selected={loginMethod === "email-otp"} onClick={() => { setLoginMethod("email-otp"); setOtpRequested(false); setCode(""); setMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMethod === "email-otp" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>Email code</button>
          </div>
          <label className="mb-2 block text-sm font-bold text-white" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setOtpRequested(false); setCode(""); }} placeholder="you@example.com" className="min-h-12 min-w-0 w-full rounded-xl border border-gray-600 bg-gray-950 py-3 pl-11 pr-4 text-white placeholder:text-white/60 outline-none focus:border-red-500" />
          </div>

          {loginMethod === "password" ? (
            <>
              <label className="mb-2 mt-5 block text-sm font-bold text-white" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="min-h-12 min-w-0 w-full rounded-xl border border-gray-600 bg-gray-950 py-3 pl-11 pr-4 text-white placeholder:text-white/60 outline-none focus:border-red-500" />
              </div>
            </>
          ) : otpRequested ? (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-white" htmlFor="email-code">Six-digit email code</label>
              <input id="email-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="min-h-12 w-full rounded-xl border border-gray-600 bg-gray-950 px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-gray-500 outline-none focus:border-red-500" />
              <button type="button" onClick={() => void requestEmailOtp()} disabled={loading} className="mt-3 text-sm font-semibold text-red-400 hover:underline disabled:opacity-60">Resend code</button>
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-300">We’ll email you a one-time sign-in code.</p>
          )}

          <button disabled={loading} type="submit" className="mt-6 w-full rounded-full bg-red-600 py-4 font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{loading ? "Please wait..." : loginMethod === "password" ? "Sign In" : otpRequested ? "Verify code and sign in" : "Email me a sign-in code"}</button>
          {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
          <p className="mt-4 text-center text-sm"><a href="/forgot-password" className="font-bold text-red-400 hover:underline">Forgot password?</a></p>
          <p className="mt-6 text-center text-sm text-gray-300">Don&apos;t have an account? <a href="/register" className="font-bold text-red-400 hover:underline">Create one</a></p>
        </form>
      </div>
    </main>
  );
}
