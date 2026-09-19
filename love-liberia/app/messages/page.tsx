"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";

type Conversation = {
  user: {
    id: string;
    firstName: string;
    username: string;
    profileImage: string | null;
    profilePhotos: { id: string; url: string }[];
    isOnline: boolean;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load conversations.");
        }

        setConversations(data.conversations || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadConversations();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-gray-400">Your conversations</p>
          </div>
          <OnlineStatus />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {loading && (
          <div className="flex flex-col items-center py-20 text-center text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <span className="mt-4">Loading conversations...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-950/60 p-5 text-center text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-sm sm:p-10">
            <MessageCircle size={50} className="mx-auto mb-4 text-gray-500" />
            <h2 className="text-lg font-semibold">No messages yet</h2>
            <p className="mt-2 text-gray-400">
              Match with someone and start a conversation.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
            >
              Discover People
            </Link>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const { user, lastMessage, unreadCount } = conversation;
              const displayProfileImage = user.profileImage || user.profilePhotos?.[0]?.url || null;

              return (
                <Link
                  key={user.id}
                  href={`/messages/${user.id}`}
                  className="flex min-h-32 flex-col items-center rounded-2xl border border-gray-800 bg-gray-900 p-5 text-center shadow-sm transition hover:border-rose-500/50 hover:bg-gray-800"
                >
                  <div className="relative mb-3 shrink-0">
                    {displayProfileImage ? (
                      <Image
                        src={displayProfileImage}
                        alt={user.firstName}
                        width={72}
                        height={72}
                        className="h-18 w-18 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-18 w-18 items-center justify-center rounded-full bg-rose-950 text-2xl font-bold text-rose-300">
                        {user.firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-gray-900 ${user.isOnline ? "bg-green-500" : "bg-gray-500"}`} />
                  </div>

                  <div className="min-w-0 w-full">
                    <div className="flex items-center justify-center gap-3">
                      <h2 className="truncate font-semibold">{user.firstName}</h2>
                      {unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-300">
                      {user.isOnline ? "Online" : "Offline"}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-400">
                      {lastMessage.content}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
