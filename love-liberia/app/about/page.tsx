import Link from "next/link";

const values = [
  ["Genuine connection", "We help Liberians meet people who share their values, goals, and hopes for meaningful relationships."],
  ["Community first", "Love Liberia brings together people in Liberia and across the diaspora in one welcoming community."],
  ["Safer dating", "Privacy controls, verification, blocking, reporting, and moderation help members connect with more confidence."],
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold text-rose-700">Back to Love Liberia</Link>
        <p className="mt-10 text-sm font-black uppercase tracking-[0.2em] text-rose-600">About Love Liberia</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Connect, love, and belong.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Love Liberia is a relationship-focused dating community for Liberians in Liberia and around the world. We make it easier to discover genuine people, start respectful conversations, and build relationships that feel real.</p>
        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-black text-rose-700">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
        <section className="mt-12 rounded-2xl bg-rose-50 p-6 sm:p-8">
          <h2 className="text-2xl font-black">Built for meaningful relationships</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-700">Whether you are looking for friendship, dating, companionship, or a life partner, Love Liberia gives you tools to share your story and connect at your own pace.</p>
          <Link href="/register" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 py-3 font-bold text-white hover:bg-rose-700">Create an account</Link>
        </section>
      </article>
    </main>
  );
}
