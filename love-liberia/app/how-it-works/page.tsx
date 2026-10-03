import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Tell people about yourself, your interests, and the kind of relationship you are looking for.",
  },
  {
    number: "02",
    title: "Discover people",
    description:
      "Browse recommended profiles and find people who share your interests and goals.",
  },
  {
    number: "03",
    title: "Make a connection",
    description:
      "Like each other, match, start a conversation, and see where the connection takes you.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-rose-400 hover:text-rose-300">
          Back to Love Liberia
        </Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-rose-400">
          Simple &amp; Easy
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">How It Works</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Start with a profile, discover people who share your goals, and build a connection at your own pace.
        </p>

        <ol className="mt-8 divide-y divide-slate-800">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4 py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-black text-rose-300">
                {step.number}
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">{step.title}</h2>
                <p className="mt-2 leading-6 text-slate-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/register"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-600"
        >
          Join Free
        </Link>
      </article>
    </main>
  );
}
