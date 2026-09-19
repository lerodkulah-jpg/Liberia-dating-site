"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const registrationDraftKey = "love-liberia-registration-draft";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let savedDraft = "";
    try {
      savedDraft = localStorage.getItem(registrationDraftKey) || "";
    } catch {
      return;
    }

    if (!savedDraft || !formRef.current) return;

    try {
      const draft = JSON.parse(savedDraft) as Record<string, string>;
      for (const [name, value] of Object.entries(draft)) {
        const field = formRef.current.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
          field.value = value;
        }
      }
    } catch {
      localStorage.removeItem(registrationDraftKey);
    }
  }, [registrationDraftKey]);

  function saveDraft() {
    if (!formRef.current) return;
    const draft: Record<string, string> = {};
    for (const field of Array.from(formRef.current.elements)) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) || !field.name || field.name === "password") continue;
      draft[field.name] = field.value;
    }

    try {
      localStorage.setItem(registrationDraftKey, JSON.stringify(draft));
    } catch {
      // Some mobile privacy modes block storage; the form still works normally.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to create your account.");
        return;
      }

      router.push("/dashboard");
      localStorage.removeItem(registrationDraftKey);
      router.refresh();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 text-white sm:px-5 sm:py-10">
      <div className="register-aurora register-aurora-one" aria-hidden="true" />
      <div className="register-aurora register-aurora-two" aria-hidden="true" />
      <div className="register-grid" aria-hidden="true" />
      <form ref={formRef} onSubmit={handleSubmit} onInput={saveDraft} className="register-card relative z-10 w-full max-w-lg rounded-3xl border border-white/20 p-5 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 text-rose-200">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-950/40"><Heart className="h-6 w-6 fill-white text-white" /></span>
            <span className="text-xl font-black tracking-tight">Love Liberia</span>
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-gray-300">Meet people who feel like home.</p>
          <a href="/safety" className="mt-4 inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15">
            Safety Center: stay protected while dating
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input name="firstName" required placeholder="First name" className="min-h-12 min-w-0 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
          <input name="username" required placeholder="Username" className="min-h-12 min-w-0 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
          <input name="email" required type="email" placeholder="Email" className="min-h-12 min-w-0 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400 sm:col-span-2" />
          <input name="password" required minLength={8} type="password" placeholder="Password (8+ characters)" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400 sm:col-span-2" />
          <input name="dateOfBirth" required type="date" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white" />
          <select name="gender" required defaultValue="" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white">
            <option value="" disabled>Gender</option>
            <option>Woman</option>
            <option>Man</option>
            <option>Non-binary</option>
          </select>
          <input name="country" defaultValue="Liberia" placeholder="Country" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
          <input name="city" placeholder="City" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
        </div>

        <section className="mt-8 border-t border-gray-800 pt-6">
          <h2 className="text-lg font-bold">About yourself</h2>
          <p className="mt-1 text-sm text-gray-400">Share a little more about who you are. You can update these details later.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-gray-300 sm:col-span-2">Bio<textarea name="bio" rows={4} maxLength={500} placeholder="Tell people a little about yourself" className="mt-2 w-full resize-none rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" /></label>
            <input name="occupation" placeholder="Occupation" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="education" placeholder="Education" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="height" placeholder="Height" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="languages" placeholder="Languages" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="interests" placeholder="Interests" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="hobbies" placeholder="Hobbies" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <input name="religion" placeholder="Religion (optional)" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white placeholder:text-gray-400" />
            <select name="smokingPreference" defaultValue="" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white">
              <option value="">Smoking preference</option>
              <option>Non-smoker</option>
              <option>Occasionally</option>
              <option>Smoker</option>
            </select>
            <select name="drinkingPreference" defaultValue="" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white">
              <option value="">Drinking preference</option>
              <option>Never</option>
              <option>Socially</option>
              <option>Often</option>
            </select>
            <select name="childrenPreference" defaultValue="" className="min-h-12 rounded-xl border border-gray-700 bg-gray-950 p-3 text-white sm:col-span-2">
              <option value="">Children preference</option>
              <option>Want children</option>
              <option>Do not want children</option>
              <option>Have children</option>
              <option>Open to discussion</option>
            </select>
          </div>
        </section>

        <button disabled={loading} type="submit" className="mt-6 min-h-12 w-full rounded-full bg-red-600 py-4 font-bold text-white hover:bg-red-700 disabled:opacity-60">
          {loading ? "Creating account..." : "Create account"}
        </button>
        {message && <p className="mt-4 text-center text-sm text-white">{message}</p>}
        <p className="mt-6 text-center text-sm text-gray-300">Already have an account? <a href="/login" className="font-bold text-red-400">Sign in</a></p>
      </form>
    </main>
  );
}
