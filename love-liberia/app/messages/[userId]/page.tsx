"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Loader2, Send } from "lucide-react";
import { useParams } from "next/navigation";
import OnlineStatus from "@/components/OnlineStatus";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

type User = {
  id: string;
  firstName: string;
  username: string;
  profileImage: string | null;
  profilePhotos: { id: string; url: string }[];
  isOnline: boolean;
};

export default function ChatPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const displayProfileImage = user?.profileImage || user?.profilePhotos?.[0]?.url || null;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChat() {
      try {
        const response = await fetch(`/api/messages?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load conversation.");
          return;
        }

        setCurrentUserId(data.currentUserId || "");
        setUser(data.user || null);
        setMessages(data.messages || []);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    void loadChat();
  }, [userId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, content: trimmedContent }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send message.");
        return;
      }

      setMessages((current) => [...current, data.message]);
      setContent("");
    } catch {
      setError("Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link
            href="/messages"
            aria-label="Back to messages"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          {displayProfileImage ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-700 bg-gray-800">
              <Image
                src={displayProfileImage}
                alt={user?.firstName || "Match"}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-950 font-bold text-rose-300">
              {user?.firstName?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-bold">{user?.firstName || "Match"}</h1>
            <p className="text-xs text-gray-400">{user?.isOnline ? "Online" : "Offline"}</p>
          </div>
          <OnlineStatus isOnline={user?.isOnline} />
          <Heart className="ml-auto h-6 w-6 shrink-0 fill-rose-500 text-rose-500" />
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 sm:px-4">
        <div className="flex-1 space-y-4 overflow-y-auto py-6">
          {error && <div className="rounded-xl bg-red-950/60 p-4 text-center text-sm text-red-200">{error}</div>}
          {messages.length === 0 && !error && (
            <div className="py-20 text-center">
              <Heart className="mx-auto h-12 w-12 fill-rose-950 text-rose-400" />
              <h2 className="mt-4 text-xl font-bold">Start your conversation</h2>
              <p className="mt-2 text-gray-400">Say hello and get to know each other.</p>
            </div>
          )}
          {messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${isMine ? "rounded-br-md bg-rose-500 text-white" : "rounded-bl-md bg-gray-900 text-gray-100 shadow-sm"}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-rose-100" : "text-gray-500"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="border-t border-gray-800 bg-gray-950 py-3 sm:py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write a message..."
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-950"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={sending || !content.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
