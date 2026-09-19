"use client";
import Image from "next/image";
import OnlineStatus from "@/components/OnlineStatus";
import VerifiedBadge from "@/components/VerifiedBadge";
import SafetyActions from "@/app/api/likes/components/SafetyActions";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  RotateCcw,
  Star,
  MapPin,
  SlidersHorizontal,
  CheckCircle,
  CircleUserRound,
} from "lucide-react";

type User = {
  id: string;
  firstName: string;
  username: string;
  gender: string;
  country: string;
  county: string | null;
  city: string | null;
  locationLabel: string;
  bio: string | null;
  relationshipGoal: string | null;
  occupation: string | null;
  education: string | null;
  languages: string | null;
  hobbies: string | null;
  interests: string | null;
  mutualInterests: string[];
  compatibilityScore: number;
  profileImage: string | null;
  profilePhotos: { id: string; url: string }[];
  verified: boolean;
  isOnline: boolean;
  age: number;
  activityLevel: number;
  likedCurrentUser?: boolean;
};

const discoverySections = [
  ["recommendedForYou", "Recommended For You"],
  ["topPicks", "Top Picks"],
  ["nearYou", "Near You"],
  ["newMembers", "New Members"],
  ["mostCompatible", "Most Compatible"],
  ["recentlyActive", "Recently Active"],
  ["peopleWhoLikedYou", "People Who Liked You"],
] as const;

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyLikesRemaining, setDailyLikesRemaining] = useState(50);
  const [superLikesRemaining, setSuperLikesRemaining] = useState(5);
  const [history, setHistory] = useState<User[]>([]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [activeSection, setActiveSection] = useState("recommendedForYou");
  const [matchCelebration, setMatchCelebration] = useState<{ currentUser: { firstName: string; profileImage: string | null }; otherUser: { id: string; firstName: string; profileImage: string | null } } | null>(null);

  // Filters
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [relationshipGoal, setRelationshipGoal] =
    useState("");
  const [online, setOnline] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreMarker = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const [swipeAnimation, setSwipeAnimation] = useState<"like" | "pass" | "">("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadUsers = useCallback(async (requestedPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (county) {
        params.set("county", county);
      }

      if (city) {
        params.set("city", city);
      }

      if (relationshipGoal) {
        params.set(
          "relationshipGoal",
          relationshipGoal
        );
      }

      if (online) {
        params.set("online", "true");
      }

      if (verified) {
        params.set("verified", "true");
      }

      params.set("sort", sort);
      params.set("page", String(requestedPage));
      params.set("limit", "18");

      const response = await fetch(
        `/api/discover?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to load profiles."
        );
        return;
      }

      const nextUsers = activeSection === "recommendedForYou" ? data.users || [] : data.sections?.[activeSection] || data.users || [];
      setUsers((current) => append ? [...current, ...nextUsers.filter((nextUser: User) => !current.some((currentUser) => currentUser.id === nextUser.id))] : nextUsers);
      setPage(data.page || requestedPage);
      setHasMore(Boolean(data.hasMore));
      setDailyLikesRemaining(data.dailyLikesRemaining ?? 50);
      setSuperLikesRemaining(data.superLikesRemaining ?? 5);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeSection, city, county, online, relationshipGoal, sort, verified]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const marker = loadMoreMarker.current;
    if (!marker || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && !loadingMore) void loadUsers(page + 1, true);
    }, { rootMargin: "480px" });
    observer.observe(marker);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadUsers, page]);

  function applyFilters() {
    loadUsers();
    setShowFilters(false);
  }

  function clearFilters() {
    setCounty("");
    setCity("");
    setRelationshipGoal("");
    setOnline(false);
    setVerified(false);
    setSort("newest");

    setTimeout(() => {
      loadUsers();
    }, 0);
  }

  async function handleAction(userId: string, action: "like" | "super") {
    if (action === "like" && dailyLikesRemaining === 0) {
      setError("You have used today's likes. Come back tomorrow.");
      return;
    }
    if (action === "super" && superLikesRemaining === 0) {
      setError("You have used today's Super Likes. Come back tomorrow.");
      return;
    }
    try {
      setSwipeAnimation(action === "like" || action === "super" ? "like" : "pass");
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: userId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSwipeAnimation("");
        setToast(data.error || "Unable to like user.");
        return;
      }

      const actedOn = users.find((user) => user.id === userId);
      if (actedOn) setHistory((previous) => [...previous, actedOn]);
      window.setTimeout(() => {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        setSwipeAnimation("");
      }, 280);
      if (action === "like") setDailyLikesRemaining((remaining) => remaining - 1);
      if (action === "super") setSuperLikesRemaining((remaining) => remaining - 1);

      if (data.matched) {
        setMatchCelebration(data.matchProfiles);
        setToast("It is a match!");
      }
    } catch {
      setSwipeAnimation("");
      setToast("Something went wrong.");
    }
  }

  async function undoLastAction() {
    const previous = history[history.length - 1];
    if (!previous) return;
    await fetch(`/api/likes?receiverId=${encodeURIComponent(previous.id)}`, { method: "DELETE" });
    setHistory((current) => current.slice(0, -1));
    setUsers((current) => [previous, ...current]);
  }

  function handleSwipeEnd(event: React.PointerEvent<HTMLElement>) {
    if (!touchStart || !users[0]) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    setTouchStart(null);
    if (Math.abs(dx) < 70 && dy > -70) return;
    if (dy < -70 && Math.abs(dy) > Math.abs(dx)) void handleAction(users[0].id, "super");
    else if (dx > 70) void handleAction(users[0].id, "like");
    else if (dx < -70) setUsers((current) => current.slice(1));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {toast && <button type="button" onClick={() => setToast("")} className="motion-toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-950 px-4 py-3 text-sm font-bold text-white shadow-xl lg:bottom-6">{toast}</button>}
      {matchCelebration && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"><div className="motion-modal w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"><p className="animate-pulse text-5xl">❤️</p><h2 className="mt-3 text-3xl font-black text-gray-900">It&apos;s a Match!</h2><p className="mt-2 text-gray-600">You both liked each other.</p><div className="mt-6 flex items-center justify-center gap-3"><div className="relative h-24 w-24 overflow-hidden rounded-full bg-pink-100">{matchCelebration.currentUser.profileImage && <Image src={matchCelebration.currentUser.profileImage} alt={matchCelebration.currentUser.firstName} fill sizes="96px" className="object-cover" />}</div><span className="text-2xl">❤️</span><div className="relative h-24 w-24 overflow-hidden rounded-full bg-pink-100">{matchCelebration.otherUser.profileImage && <Image src={matchCelebration.otherUser.profileImage} alt={matchCelebration.otherUser.firstName} fill sizes="96px" className="object-cover" />}</div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><Link href={`/messages/${matchCelebration.otherUser.id}`} className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-pink-700">Start Chat</Link><button type="button" onClick={() => setMatchCelebration(null)} className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50">Keep Discovering</button></div></div></div>}
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-pink-600"
            >
              Love Liberia
            </Link>

            <p className="text-sm text-gray-500">Smart recommendations</p>
          </div>

          <OnlineStatus />

          <button
            onClick={() =>
              setShowFilters(!showFilters)
            }
            className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 text-xs font-semibold text-gray-500">
          <span>{dailyLikesRemaining} likes left</span><span>•</span><span>{superLikesRemaining} Super Likes left</span>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-4">
          {discoverySections.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveSection(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeSection === key ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>)}
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              
              {/* County */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  County
                </label>

                <select
                  value={county}
                  onChange={(e) =>
                    setCounty(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-pink-500"
                >
                  <option value="">
                    All Counties
                  </option>
                  <option value="Bomi">
                    Bomi
                  </option>
                  <option value="Bong">
                    Bong
                  </option>
                  <option value="Gbarpolu">
                    Gbarpolu
                  </option>
                  <option value="Grand Bassa">
                    Grand Bassa
                  </option>
                  <option value="Grand Cape Mount">
                    Grand Cape Mount
                  </option>
                  <option value="Grand Gedeh">
                    Grand Gedeh
                  </option>
                  <option value="Grand Kru">
                    Grand Kru
                  </option>
                  <option value="Lofa">
                    Lofa
                  </option>
                  <option value="Margibi">
                    Margibi
                  </option>
                  <option value="Maryland">
                    Maryland
                  </option>
                  <option value="Montserrado">
                    Montserrado
                  </option>
                  <option value="Nimba">
                    Nimba
                  </option>
                  <option value="River Cess">
                    River Cess
                  </option>
                  <option value="River Gee">
                    River Gee
                  </option>
                  <option value="Sinoe">
                    Sinoe
                  </option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  City
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="Enter city"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500"
                />
              </div>

              {/* Relationship Goal */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Relationship Goal
                </label>

                <select
                  value={relationshipGoal}
                  onChange={(e) =>
                    setRelationshipGoal(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-pink-500"
                >
                  <option value="">
                    Any Goal
                  </option>

                  <option value="Long-term relationship">
                    Long-term relationship
                  </option>

                  <option value="Marriage">
                    Marriage
                  </option>

                  <option value="Serious dating">
                    Serious dating
                  </option>

                  <option value="Friendship">
                    Friendship
                  </option>

                  <option value="Something casual">
                    Something casual
                  </option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Sort By
                </label>

                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-pink-500"
                >
                  <option value="recommended">Recommended for you</option><option value="newest">Newest</option>

                  <option value="online">
                    Online First
                  </option>
                </select>
              </div>

              {/* Online */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={online}
                  onChange={(e) =>
                    setOnline(e.target.checked)
                  }
                  className="h-5 w-5 accent-pink-600"
                />

                <div>
                  <p className="font-medium text-gray-800">
                    Online users
                  </p>

                  <p className="text-xs text-gray-500">
                    Show only people online
                  </p>
                </div>
              </label>

              {/* Verified */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) =>
                    setVerified(e.target.checked)
                  }
                  className="h-5 w-5 accent-pink-600"
                />

                <div>
                  <p className="flex items-center gap-1 font-medium text-gray-800">
                    Verified profiles
                    <CheckCircle
                      size={16}
                      className="text-blue-500"
                    />
                  </p>

                  <p className="text-xs text-gray-500">
                    Show verified members only
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={applyFilters}
                className="rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700"
              >
                Apply Filters
              </button>

              <button
                onClick={clearFilters}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Profiles */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm"><div className="motion-skeleton h-72 rounded-xl" /><div className="mt-4 motion-skeleton h-5 w-2/3 rounded" /><div className="mt-3 motion-skeleton h-4 w-1/2 rounded" /><div className="mt-5 motion-skeleton h-11 rounded-xl" /></div>)}</div>}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          users.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <CircleUserRound
                size={55}
                className="mx-auto mb-4 text-gray-300"
              />

              <h2 className="text-xl font-bold text-gray-800">
                No profiles found
              </h2>

              <p className="mt-2 text-gray-500">
                Try changing your filters.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white"
              >
                Clear Filters
              </button>
            </div>
          )}

        <div className="mb-5 hidden items-center justify-between rounded-xl bg-white p-3 shadow-sm sm:flex">
          <span className="text-sm text-gray-600">Smart recommendations ranked by compatibility</span>
          <button type="button" onClick={() => void undoLastAction()} disabled={history.length === 0} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"><RotateCcw size={16} />Undo / Rewind</button>
        </div>

        <div className="relative mx-auto mb-6 h-147.5 max-w-md sm:hidden">
          {users.slice(0, 3).reverse().map((user, index) => (
            <article key={user.id} onPointerDown={(event) => index === 2 && setTouchStart({ x: event.clientX, y: event.clientY })} onPointerUp={(event) => index === 2 && handleSwipeEnd(event)} className={`absolute inset-0 overflow-hidden rounded-3xl bg-white shadow-xl transition-transform ${index === 2 ? `z-10 ${swipeAnimation === "like" ? "motion-swipe-like" : swipeAnimation === "pass" ? "motion-swipe-pass" : ""}` : "scale-[0.96] opacity-60"}`}>
              <div className="relative h-80 bg-gray-100">{user.profileImage ? <Image src={user.profileImage} alt={user.firstName} fill sizes="100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-7xl font-bold text-pink-300">{user.firstName.charAt(0).toUpperCase()}</div>}{user.verified && <VerifiedBadge compact className="absolute right-4 top-4" />}</div>
              <div className="p-5"><h2 className="text-2xl font-black text-gray-900">{user.firstName}, {user.age}</h2><p className="mt-1 flex items-center gap-1 text-sm text-gray-600"><MapPin size={15} />{user.locationLabel}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-pink-50 px-3 py-1 text-sm font-bold text-pink-600">{user.compatibilityScore}% match</span>{user.relationshipGoal && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{user.relationshipGoal}</span>}</div><p className="mt-3 line-clamp-2 text-sm text-gray-600">{user.bio || "No bio added yet."}</p><p className="mt-3 text-xs text-gray-500">{user.mutualInterests.length ? `Mutual interests: ${user.mutualInterests.join(", ")}` : user.interests || "Discover something new together"}</p></div>
            </article>
          ))}
        </div>
        <div className="mb-6 flex justify-center gap-3 sm:hidden"><button type="button" onClick={() => { if (!users[0]) return; setSwipeAnimation("pass"); window.setTimeout(() => { setUsers((current) => current.slice(1)); setSwipeAnimation(""); }, 280); }} className="rounded-full border-2 border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition hover:-translate-y-0.5">Pass</button><button type="button" onClick={() => void undoLastAction()} disabled={!history.length} className="rounded-full border-2 border-gray-300 bg-white p-3 text-gray-600 transition hover:rotate-[-20deg] disabled:opacity-40"><RotateCcw size={18} /></button><button type="button" onClick={() => users[0] && void handleAction(users[0].id, "like")} className="rounded-full bg-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:scale-105"><Heart size={18} /></button><button type="button" onClick={() => users[0] && void handleAction(users[0].id, "super")} className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-white transition hover:scale-105"><Star size={18} /></button></div>

        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Photo */}
              <div className="relative h-72 bg-gray-100">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.firstName}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl font-bold text-pink-300">
                    {user.firstName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* Online */}
                {user.isOnline && (
                  <span className="absolute left-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                    ● Online
                  </span>
                )}

                {/* Verified */}
                {user.verified && (
                  <VerifiedBadge compact className="absolute right-3 top-3 shadow" />
                )}
              </div>

              {/* Information */}
              <div className="p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  {user.firstName}, {user.age}

                  {user.verified && <VerifiedBadge compact />}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  @{user.username}
                </p>

                {(user.county || user.city) && (
                  <p className="mt-3 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={16} />

                    {user.locationLabel}
                  </p>
                )}

                {user.relationshipGoal && (
                  <p className="mt-3 text-sm text-pink-600">
                    ❤️ {user.relationshipGoal}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-pink-50 px-2 py-1 font-bold text-pink-600">{user.compatibilityScore}% compatible</span>{user.interests && <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">{user.interests}</span>}</div>

                {user.bio && (
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                    {user.bio}
                  </p>
                )}

                {user.profilePhotos?.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {user.profilePhotos.slice(0, 3).map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                        <Image src={photo.url} alt={`${user.firstName}'s profile`} fill sizes="100px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Like */}
                <button
                  onClick={() => void handleAction(user.id, "like")}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700"
                >
                  <Heart size={18} />
                  Like
                </button>
                <SafetyActions
                  userId={user.id}
                  userName={user.firstName}
                />
              </div>
            </article>
          ))}
        </div>
        {loadingMore && <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="motion-skeleton h-24 rounded-2xl bg-white" />)}</div>}
        <div ref={loadMoreMarker} className="h-8" aria-hidden="true" />
      </section>
    </main>
  );
}