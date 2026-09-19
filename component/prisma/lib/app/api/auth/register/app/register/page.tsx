"use client";

import { Heart, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

const counties = [
  "Bomi",
  "Bong",
  "Grand Bassa",
  "Grand Cape Mount",
  "Grand Gedeh",
  "Grand Kru",
  "Lofa",
  "Margibi",
  "Maryland",
  "Montserrado",
  "Nimba",
  "River Cess",
  "River Gee",
  "Sinoe",
  "Gbarpolu",
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    country: "Liberia",
    county: "",
    city: "",
    relationshipGoal: "",
    interestedIn: "",
  });

  function updateField(
    field: string,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage(
        "Account created successfully! You can now sign in."
      );

      setForm({
        firstName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        dateOfBirth: "",
        gender: "",
        country: "Liberia",
        county: "",
        city: "",
        relationshipGoal: "",
        interestedIn: "",
      });
    } catch {
      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10 dark:bg-gray-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
            <Heart
              size={28}
              className="fill-white text-white"
            />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Join Love
            <span className="text-red-600">
              Liberia
            </span>
          </h1>

          <p className="mt-2 text-gray-500">
            Create your account and start meeting people.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(value) =>
                updateField("firstName", value)
              }
              required
            />

            <Input
              label="Username"
              value={form.username}
              onChange={(value) =>
                updateField("username", value)
              }
              required
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField("email", value)
              }
              required
            />

            <Input
              label="Phone number"
              value={form.phone}
              onChange={(value) =>
                updateField("phone", value)
              }
            />

            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) =>
                updateField("password", value)
              }
              required
            />

            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(value) =>
                updateField("dateOfBirth", value)
              }
              required
            />

            <Select
              label="Gender"
              value={form.gender}
              onChange={(value) =>
                updateField("gender", value)
              }
              options={[
                "Male",
                "Female",
                "Other",
              ]}
              required
            />

            <Select
              label="Interested in"
              value={form.interestedIn}
              onChange={(value) =>
                updateField("interestedIn", value)
              }
              options={[
                "Men",
                "Women",
                "Everyone",
              ]}
              required
            />

            <Select
              label="County"
              value={form.county}
              onChange={(value) =>
                updateField("county", value)
              }
              options={counties}
            />

            <Input
              label="City / Town"
              value={form.city}
              onChange={(value) =>
                updateField("city", value)
              }
            />

            <div className="sm:col-span-2">
              <Select
                label="What are you looking for?"
                value={form.relationshipGoal}
                onChange={(value) =>
                  updateField(
                    "relationshipGoal",
                    value
                  )
                }
                options={[
                  "Long-term relationship",
                  "Marriage",
                  "Dating",
                  "Friendship",
                ]}
              />
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-xl bg-gray-100 p-4 text-sm font-medium dark:bg-gray-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-4 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={19}
                className="animate-spin"
              />
            )}

            {loading
              ? "Creating account..."
              : "Create my account"}
          </button>

          <p className="mt-5 text-center text-xs text-gray-500">
            You must be 18 or older to use Love Liberia.
          </p>

          <p className="mt-3 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-red-600 hover:underline"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10 dark:border-gray-700 dark:bg-gray-950"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-red-600 dark:border-gray-700 dark:bg-gray-950"
      >
        <option value="">
          Select an option
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}