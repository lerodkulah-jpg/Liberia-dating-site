import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, MapPin, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import OnlineStatus from "@/components/OnlineStatus";
import VerifiedBadge from "@/components/VerifiedBadge";

function getAge(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const birthdayPassed =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());

  if (!birthdayPassed) age -= 1;
  return age;
}

function formatLastActive(lastActive: Date, isOnline: boolean) {
  if (isOnline) return "Online now";

  const elapsedMinutes = Math.max(1, Math.floor((Date.now() - lastActive.getTime()) / 60000));
  if (elapsedMinutes < 60) return `Last active ${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Last active ${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Last active ${elapsedDays}d ago`;
}

export default async function ProfilePage() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      profilePhotos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const profilePhotos = user.profilePhotos ?? [];
  const age = getAge(user.dateOfBirth);
  const location = [user.city, user.county, user.country].filter(Boolean).join(", ");
  const trustVerified = user.verified || user.emailVerified || user.phoneVerified || user.photoVerified;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <OnlineStatus isOnline={user.isOnline} />
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-rose-400">
            <ArrowLeft className="h-5 w-5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="bg-linear-to-r from-rose-500 to-pink-500 px-4 py-8 text-center text-white sm:px-6 sm:py-10">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={`${user.firstName}'s profile`}
                width={96}
                height={96}
                className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white/30"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                <User className="h-12 w-12" />
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{user.firstName}</h1>
              {trustVerified && <VerifiedBadge compact />}
            </div>
            <p className="mt-1 opacity-90">@{user.username}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-white/90">
              <span>{age} years old</span>
              <span aria-hidden="true">•</span>
              <span>{location || "Location not specified"}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <OnlineStatus isOnline={user.isOnline} />
              <span className="text-sm text-white/80">{formatLastActive(user.updatedAt, user.isOnline)}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {profilePhotos.length > 0 && (
              <div className="mb-8 border-b border-gray-800 pb-8">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Photo Gallery</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {profilePhotos.length} additional {profilePhotos.length === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                  <Link href="/profile/edit" className="text-sm font-semibold text-rose-400 hover:text-rose-300">
                    Manage photos
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profilePhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                      <Image src={photo.url} alt={`${user.firstName}'s gallery photo`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition duration-300 hover:scale-105" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-xl font-bold text-white">About Me</h2>
            <p className="mt-3 text-gray-300">{user.bio || "This person hasn't added a bio yet."}</p>

            {(user.occupation || user.education || user.height || user.languages || user.interests || user.hobbies || user.religion || user.smokingPreference || user.drinkingPreference || user.childrenPreference) && (
              <div className="mt-8 border-t border-gray-800 pt-8">
                <h2 className="text-xl font-bold text-white">About yourself</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {[
                    ["Occupation", user.occupation],
                    ["Education", user.education],
                    ["Height", user.height],
                    ["Languages", user.languages],
                    ["Interests", user.interests],
                    ["Hobbies", user.hobbies],
                    ["Religion", user.religion],
                    ["Smoking preference", user.smokingPreference],
                    ["Drinking preference", user.drinkingPreference],
                    ["Children preference", user.childrenPreference],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-sm text-gray-400">{label}</p>
                      <p className="mt-1 font-medium text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-rose-400" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium text-white">{user.city || "Not specified"}{user.county ? `, ${user.county}` : ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="mt-1 h-5 w-5 text-rose-400" />
                <div>
                  <p className="text-sm text-gray-400">Looking for</p>
                  <p className="font-medium text-white">{user.relationshipGoal || "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-800 pt-8">
              <h2 className="text-xl font-bold text-white">Dating Preferences</h2>
              <div className="mt-5">
                <p className="text-sm text-gray-400">Interested in</p>
                <p className="font-medium text-white">{user.preferences?.interestedIn || "Not specified"}</p>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div><p className="text-sm text-gray-400">Minimum age</p><p className="font-medium text-white">{user.preferences?.minAge || 18}</p></div>
                <div><p className="text-sm text-gray-400">Maximum age</p><p className="font-medium text-white">{user.preferences?.maxAge || 60}</p></div>
              </div>
            </div>

            <Link href="/profile/edit" className="mt-10 block min-h-12 w-full rounded-xl bg-rose-500 py-3 text-center font-semibold text-white transition hover:bg-rose-600">Edit Profile</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
