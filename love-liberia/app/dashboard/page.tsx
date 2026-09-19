import LogoutButton from "@/components/LogoutButton";
import OnlineStatus from "@/app/components/OnlineStatus";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Heart, MessageCircle, ShieldAlert, Sparkles, User, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import VerifiedBadge from "@/components/VerifiedBadge";
import InviteButton from "@/components/InviteButton";

export default async function DashboardPage() {
  const token = (await cookies()).get("love_liberia_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const userId = await verifyAuthToken(token);
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profilePhotos: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!user) {
    redirect("/login");
  }

  const displayProfileImage = user.profileImage || user.profilePhotos[0]?.url;

  const sentLikes = await prisma.like.findMany({
    where: { senderId: userId },
    select: { receiverId: true },
  });
  const receivedLikes = await prisma.like.findMany({
    where: { receiverId: userId },
    select: { senderId: true },
  });
  const receivedIds = new Set(receivedLikes.map((like) => like.senderId));
  const mutualMatchId = sentLikes.find((like) => receivedIds.has(like.receiverId))?.receiverId;
  const mutualMatch = mutualMatchId
    ? await prisma.user.findUnique({
        where: { id: mutualMatchId },
        select: { firstName: true, username: true },
      })
    : null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="max-w-md rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <LogoutButton />
        </div>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <OnlineStatus isOnline={user.isOnline} />
        <div className="mt-5 max-w-md rounded-2xl border border-rose-500/30 bg-gray-900 p-4">
          <p className="mb-3 text-sm text-gray-300">Invite someone to Love Liberia.</p>
          <InviteButton username={user.username} />
        </div>
        <p className="text-gray-300">Welcome back,</p>
        <div className="mt-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-rose-950 text-3xl font-bold text-rose-300">
          {displayProfileImage ? (
            <Image src={displayProfileImage} alt={`${user.firstName}'s profile`} width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            user.firstName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold text-white">{user.firstName}</h1>
          {user.verified && <VerifiedBadge compact />}
        </div>
        <p className="mt-2 text-gray-300">Find meaningful connections in Liberia.</p>

        {mutualMatch && (
          <div className="mt-8 rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-rose-300">It&apos;s a match</p>
                <h2 className="mt-2 text-2xl font-black text-white">You and {mutualMatch.firstName} liked each other.</h2>
                <p className="mt-2 text-gray-300">Start a conversation and see where it goes.</p>
              </div>
              <Link href="/matches" className="min-h-11 rounded-xl bg-rose-500 px-5 py-3 text-center font-bold text-white hover:bg-rose-600">View match</Link>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/discover" className="rounded-2xl bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <Heart className="mb-4 h-6 w-6 text-rose-500" />
            <h2 className="text-xl font-bold text-white">Discover</h2>
            <p className="mt-2 text-sm text-gray-300">Discover people who may be a great match for you.</p>
          </Link>
          <Link href="/matches" className="rounded-2xl bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <Heart className="mb-4 h-6 w-6 text-rose-500" />
            <h2 className="text-xl font-bold text-white">Matches</h2>
            <p className="mt-2 text-sm text-gray-300">See people who liked you back.</p>
          </Link>
          <Link href="/messages" className="rounded-2xl bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <MessageCircle className="mb-4 h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <p className="mt-2 text-sm text-gray-300">Chat with people you connect with.</p>
          </Link>
          <Link href="/profile" className="rounded-2xl bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <User className="mb-4 h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-white">My Profile</h2>
            <p className="mt-2 text-sm text-gray-300">Update your profile and dating preferences.</p>
          </Link>
          <Link href="/safety" className="rounded-2xl border border-amber-500/20 bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <ShieldAlert className="mb-4 h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Safety Center</h2>
            <p className="mt-2 text-sm text-gray-300">Learn how to stay safe and report suspicious activity.</p>
          </Link>
          <Link href="/membership" className="rounded-2xl border border-rose-500/30 bg-linear-to-br from-rose-950 to-purple-950 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <Sparkles className="mb-4 h-6 w-6 text-amber-300" />
            <h2 className="text-xl font-bold text-white">Membership</h2>
            <p className="mt-2 text-sm text-gray-300">Unlock more ways to discover and connect.</p>
          </Link>
          <Link href="/wallet" className="rounded-2xl border border-amber-500/20 bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <WalletCards className="mb-4 h-6 w-6 text-amber-300" />
            <h2 className="text-xl font-bold text-white">Credits wallet</h2>
            <p className="mt-2 text-sm text-gray-300">Buy boosts, Super Likes, rewinds, and gifts.</p>
          </Link>
          <Link href="/visitors" className="rounded-2xl border border-sky-500/20 bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <Eye className="mb-4 h-6 w-6 text-sky-300" />
            <h2 className="text-xl font-bold text-white">Who viewed me</h2>
            <p className="mt-2 text-sm text-gray-300">See who is taking interest in your profile.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
