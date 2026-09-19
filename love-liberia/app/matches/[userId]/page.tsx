"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, MapPin, MessageCircle, Star } from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";
import VerifiedBadge from "@/components/VerifiedBadge";
import SafetyActions from "@/app/api/likes/components/SafetyActions";
import GiftPicker from "@/components/GiftPicker";

type MatchProfile = {
  id: string;
  firstName: string;
  username: string;
  age: number;
  gender: string;
  country: string;
  county: string | null;
  city: string | null;
  bio: string | null;
  relationshipGoal: string | null;
  occupation: string | null;
  education: string | null;
  languages: string | null;
  interests: string | null;
  hobbies: string | null;
  smokingPreference: string | null;
  drinkingPreference: string | null;
  childrenPreference: string | null;
  profileImage: string | null;
  profilePhotos: { id: string; url: string }[];
  verified: boolean;
  isOnline: boolean;
  preferences: { interestedIn: string; minAge: number; maxAge: number } | null;
  compatibilityPercentage: number;
  mutualInterests: string[];
  sharedConnections: number;
};

export default function MatchProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<MatchProfile | null>(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`/api/matches/${userId}`);
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Unable to load profile.");
          return;
        }
        setUser(data.user);
      } catch {
        setError("Unable to connect to the server.");
      }
    }
    void loadProfile();
  }, [userId]);

  if (error) return <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-red-200"><div><p>{error}</p><Link href="/matches" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white">Back to matches</Link></div></main>;
  if (!user) return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white"><Loader2 className="h-10 w-10 animate-spin text-rose-500" /></main>;

  const displayProfileImage = user.profileImage || user.profilePhotos?.[0]?.url || null;
  const location = [user.city, user.county, user.country].filter(Boolean).join(", ");
  async function runLike(action: "like" | "super") {
    const response = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: userId, action }) });
    const data = await response.json();
    setActionMessage(response.ok ? data.message || "Action completed." : data.error || "Unable to complete action.");
  }

  async function passProfile() {
    const response = await fetch("/api/passes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passedUserId: userId }) });
    setActionMessage(response.ok ? "Profile passed." : "Unable to pass this profile.");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:py-4"><Link href="/matches" className="flex min-h-11 items-center gap-2 text-gray-300 hover:text-rose-400"><ArrowLeft className="h-5 w-5" />Matches</Link><OnlineStatus /><Heart className="h-6 w-6 fill-rose-500 text-rose-500" /></div></nav>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
          <div className="relative flex h-80 items-center justify-center bg-linear-to-br from-rose-950 to-pink-950 sm:h-96">
            {displayProfileImage ? <Image src={displayProfileImage} alt={user.firstName} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" /> : <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-800 text-5xl font-bold text-rose-300">{user.firstName.charAt(0).toUpperCase()}</div>}
            <div className="absolute right-4 top-4">
              <OnlineStatus isOnline={user.isOnline} />
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-black">{user.firstName}, {user.age}</h1>{user.verified && <VerifiedBadge />}</div>
            <p className="mt-1 text-gray-400">@{user.username}</p>
            <p className="mt-4 flex items-center gap-2 text-gray-300"><MapPin className="h-5 w-5 text-rose-400" />{location}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-emerald-950 px-3 py-1 font-semibold text-emerald-300">{user.compatibilityPercentage}% compatible</span>
              <span className="rounded-full bg-gray-800 px-3 py-1 text-gray-300">{user.sharedConnections} shared connection{user.sharedConnections === 1 ? "" : "s"}</span>
            </div>
            {user.relationshipGoal && <p className="mt-4 rounded-xl bg-rose-950/60 px-4 py-3 text-rose-200">Looking for: {user.relationshipGoal}</p>}
            <div className="mt-7 border-t border-gray-800 pt-6"><h2 className="text-xl font-bold">About {user.firstName}</h2><p className="mt-3 leading-7 text-gray-300">{user.bio || "No bio added yet."}</p></div>
            <div className="mt-7 grid gap-5 border-t border-gray-800 pt-6 sm:grid-cols-2">
              {[['Education', user.education], ['Occupation', user.occupation], ['Languages', user.languages], ['Hobbies', user.hobbies], ['Smoking', user.smokingPreference], ['Drinking', user.drinkingPreference], ['Children', user.childrenPreference]].filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-sm text-gray-400">{label}</p><p className="mt-1 font-medium text-white">{value}</p></div>)}
            </div>
            {user.mutualInterests.length > 0 && <div className="mt-7 border-t border-gray-800 pt-6"><h2 className="text-xl font-bold">Mutual interests</h2><div className="mt-3 flex flex-wrap gap-2">{user.mutualInterests.map((interest) => <span key={interest} className="rounded-full bg-rose-950 px-3 py-1 text-sm text-rose-200">{interest}</span>)}</div></div>}
            {user.profilePhotos.length > 0 && <div className="mt-7 border-t border-gray-800 pt-6"><h2 className="text-xl font-bold">More photos</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{user.profilePhotos.map((photo) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl"><Image src={photo.url} alt={`${user.firstName}'s profile`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" /></div>)}</div></div>}
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => void runLike("like")} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold hover:bg-rose-600"><Heart className="h-4 w-4" />Like</button>
              <button type="button" onClick={() => void passProfile()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-800">❌ Pass</button>
              <button type="button" onClick={() => void runLike("super")} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/60 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-950"><Star className="h-4 w-4" />Super Like</button>
              <Link href={`/messages/${user.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-800"><MessageCircle className="h-4 w-4" />Message</Link>
              <GiftPicker receiverId={user.id} receiverName={user.firstName} />
            </div>
            {actionMessage && <p className="mt-4 rounded-lg bg-gray-800 p-3 text-sm text-gray-200">{actionMessage}</p>}
            <SafetyActions userId={user.id} userName={user.firstName} />
          </div>
        </div>
      </section>
    </main>
  );
}
