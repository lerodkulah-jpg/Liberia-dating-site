import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Heart,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

async function requireAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, role: true },
  });

  if (!user || !can(user.role, "dashboard")) {
    redirect("/dashboard");
  }

  return user;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    activeUsers,
    verifiedUsers,
    pendingReports,
    totalLikes,
    totalBlocks,
    recentReports,
    newRegistrations,
    matches,
    totalMessages,
    premiumSubscribers,
    revenue,
    bannedUsers,
    suspiciousAccounts,
    growthUsers,
    activeTrend,
    revenueTrend,
    locationUsers,
    monthlyActiveUsers,
    retentionUsers,
  ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { verified: true } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.like.count(),
      prisma.block.count(),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          reported: { select: { firstName: true, username: true } },
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.like.count(),
      prisma.message.count(),
      prisma.user.count({ where: { membershipPlan: { in: ["PREMIUM", "VIP"] }, membershipStatus: "ACTIVE" } }),
      prisma.creditTransaction.aggregate({ _sum: { amountCents: true }, where: { status: "COMPLETED", amountCents: { gt: 0 } } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { reportsReceived: { some: { status: "PENDING" } } } }),
      prisma.user.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
      prisma.user.findMany({ where: { updatedAt: { gte: sevenDaysAgo } }, select: { updatedAt: true } }),
      prisma.creditTransaction.findMany({ where: { status: "COMPLETED", amountCents: { gt: 0 }, createdAt: { gte: sevenDaysAgo } }, select: { amountCents: true, createdAt: true } }),
      prisma.user.findMany({ select: { county: true } }),
      prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, updatedAt: { gte: thirtyDaysAgo } } }),
    ]);

  const growthBuckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return { label: day.toLocaleDateString(undefined, { weekday: "short" }), value: growthUsers.filter((user) => user.createdAt >= day && user.createdAt < next).length };
  });
  const activeBuckets = growthBuckets.map((bucket, index) => { const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index)); const next = new Date(day); next.setDate(next.getDate() + 1); return { ...bucket, value: activeTrend.filter((user) => user.updatedAt >= day && user.updatedAt < next).length }; });
  const revenueBuckets = growthBuckets.map((bucket, index) => { const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index)); const next = new Date(day); next.setDate(next.getDate() + 1); return { ...bucket, value: revenueTrend.filter((item) => item.createdAt >= day && item.createdAt < next).reduce((sum, item) => sum + item.amountCents, 0) / 100 }; });
  const locationBuckets = Object.entries(locationUsers.reduce<Record<string, number>>((counts, user) => { const location = user.county || "Not specified"; counts[location] = (counts[location] || 0) + 1; return counts; }, {})).sort(([, first], [, second]) => second - first).slice(0, 6);

  const metrics = [
    {
      label: "Total members",
      value: totalUsers,
      detail: `${activeUsers} active accounts`,
      icon: Users,
      tone: "border-rose-500 text-rose-600",
    },
    {
      label: "Verified users",
      value: verifiedUsers,
      detail: "Profiles with verified status",
      icon: BadgeCheck,
      tone: "border-emerald-500 text-emerald-600",
    },
    { label: "New registrations", value: newRegistrations, detail: "Last 30 days", icon: Users, tone: "border-violet-500 text-violet-600" },
    { label: "Matches", value: Math.floor(matches / 2), detail: "Mutual connection activity", icon: Heart, tone: "border-pink-500 text-pink-600" },
    { label: "Messages", value: totalMessages, detail: "Messages sent", icon: Activity, tone: "border-blue-500 text-blue-600" },
    { label: "Premium subscribers", value: premiumSubscribers, detail: "Active Premium and VIP", icon: BadgeCheck, tone: "border-purple-500 text-purple-600" },
    { label: "Revenue", value: `$${((revenue._sum.amountCents || 0) / 100).toFixed(2)}`, detail: "Completed credit purchases", icon: Activity, tone: "border-emerald-500 text-emerald-600" },
    { label: "Reports", value: pendingReports, detail: "Pending moderation queue", icon: CircleAlert, tone: "border-amber-500 text-amber-600" },
    { label: "Banned users", value: bannedUsers, detail: "Restricted accounts", icon: ShieldCheck, tone: "border-red-500 text-red-600" },
    { label: "Suspicious accounts", value: suspiciousAccounts, detail: "Accounts with pending reports", icon: CircleAlert, tone: "border-orange-500 text-orange-600" },
    {
      label: "Pending reports",
      value: pendingReports,
      detail: "Review community safety issues",
      icon: CircleAlert,
      tone: "border-amber-500 text-amber-600",
    },
    {
      label: "Likes sent",
      value: totalLikes,
      detail: "Connection activity",
      icon: Heart,
      tone: "border-pink-500 text-pink-600",
    },
    {
      label: "Active blocks",
      value: totalBlocks,
      detail: "Member safety actions",
      icon: ShieldCheck,
      tone: "border-sky-500 text-sky-600",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">
              Love Liberia
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Admin dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">Welcome, {admin.firstName}</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-50"
            >
              View site
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Activity className="h-4 w-4 text-emerald-600" />
              Live community overview
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
              Keep the community healthy.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/risk"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100"
            >
              Review risk flags
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800 hover:bg-violet-100"
            >
              Review manual payments
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700"
            >
              Review reports
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className={`border-t-4 bg-white p-5 shadow-sm ${metric.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-500">
                    {metric.label}
                  </p>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                  {metric.value.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="Analytics charts">
          {[
            ["User growth", growthBuckets, "bg-rose-500"],
            ["Daily active users", activeBuckets, "bg-sky-500"],
            ["Subscription revenue", revenueBuckets, "bg-emerald-500"],
          ].map(([title, buckets, tone]) => {
            const values = buckets as { label: string; value: number }[];
            const maximum = Math.max(1, ...values.map((bucket) => bucket.value));
            return <div key={title as string} className="bg-white p-5 shadow-sm"><h2 className="font-black">{title as string}</h2><div className="mt-5 flex h-36 items-end gap-2">{values.map((bucket) => <div key={bucket.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t ${tone as string}`} style={{ height: `${Math.max(4, (bucket.value / maximum) * 100)}%` }} title={`${bucket.value}`} /><span className="text-[10px] text-slate-400">{bucket.label}</span></div>)}</div></div>;
          })}
          <div className="bg-white p-5 shadow-sm"><h2 className="font-black">Registration by location</h2><div className="mt-5 space-y-3">{locationBuckets.map(([location, count]) => <div key={location}><div className="flex justify-between text-sm"><span>{location}</span><span className="font-bold">{count}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.max(6, (count / Math.max(1, locationBuckets[0]?.[1] || 1)) * 100)}%` }} /></div></div>)}</div></div>
          <div className="bg-white p-5 shadow-sm"><h2 className="font-black">Monthly active users</h2><p className="mt-3 text-4xl font-black">{monthlyActiveUsers.toLocaleString()}</p><p className="mt-2 text-sm text-slate-500">Members active in the last 30 days.</p><h2 className="mt-8 font-black">User retention</h2><p className="mt-3 text-4xl font-black">{retentionUsers.toLocaleString()}</p><p className="mt-2 text-sm text-slate-500">Members from the previous 30-day cohort active this month.</p></div>
        </section>

        <section className="mt-8" aria-labelledby="admin-controls-title">
          <div className="mb-4">
            <h2 id="admin-controls-title" className="text-lg font-black">
              Admin controls
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep member activity, verification, and safety work in one place.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white p-5 shadow-sm" id="verified-users">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="mt-4 font-black">Verified users</h3>
              <p className="mt-2 text-sm text-slate-500">
                {verifiedUsers.toLocaleString()} verified profiles are active.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CircleAlert className="h-5 w-5 text-amber-600" />
              <h3 className="mt-4 font-black">Pending reports</h3>
              <p className="mt-2 text-sm text-slate-500">
                Review {pendingReports.toLocaleString()} submitted reports.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                Review reports <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              id="user-management"
            >
              <UserCog className="h-5 w-5 text-sky-600" />
              <h3 className="mt-4 font-black">User management</h3>
              <p className="mt-2 text-sm text-slate-500">
                Monitor {totalUsers.toLocaleString()} member accounts and access.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                Manage users <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/admin/reports"
              className="bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ShieldCheck className="h-5 w-5 text-rose-600" />
              <h3 className="mt-4 font-black">Safety and moderation</h3>
              <p className="mt-2 text-sm text-slate-500">
                Review reports and member safety actions.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                Open moderation <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/admin/commerce"
              className="bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Activity className="h-5 w-5 text-violet-600" />
              <h3 className="mt-4 font-black">Commerce management</h3>
              <p className="mt-2 text-sm text-slate-500">
                Manage subscriptions, wallet activity, gifts, and boosts.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                Open commerce <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-8 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-black">Safety and moderation</h2>
              <p className="mt-1 text-sm text-slate-500">
                The latest safety reports from members.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-sm font-bold text-rose-600 hover:text-rose-700"
            >
              View all
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
              No reports have been submitted.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <CircleAlert className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {report.reason}
                      </p>
                      <p className="text-sm text-slate-500">
                        About @{report.reported.username} ({report.reported.firstName})
                      </p>
                    </div>
                  </div>
                  <time className="text-sm text-slate-500" dateTime={report.createdAt.toISOString()}>
                    {report.createdAt.toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}