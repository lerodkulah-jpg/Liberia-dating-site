"use client";

import { Heart, Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    alert(
      "Login authentication will be connected in the next authentication step."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
            <Heart
              size={28}
              className="fill-white text-white"
            />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Welcome back
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to your Love Liberia account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <label className="mb-2 block text-sm font-bold">
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-red-600 dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold">
              Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Your password"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-red-600 dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
          </div>

          <div className="mt-4 text-right">
            <a
              href="#"
              className="text-sm font-bold text-red-600"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-red-600 py-4 font-bold text-white transition hover:bg-red-700"
          >
            Sign In
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-bold text-red-600 hover:underline"
            >
              Create one
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}