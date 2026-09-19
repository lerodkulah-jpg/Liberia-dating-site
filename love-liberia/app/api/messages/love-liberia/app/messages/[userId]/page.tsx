"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Send, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

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
  isOnline: boolean;
};

export default function ChatPage() {
  const params = useParams();

  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
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

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: userId,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send message.");
        setSending(false);
        return;
      }

      setMessages((current) => [
        ...current,
        data.message,
      ]);

      setContent("");
    } catch {
      setError("Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-6 py-4">
          <Link
            href="/matches"
            className="text-gray-600 hover:text-rose-500"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-500">
            {user?.firstName?.charAt(0).toUpperCase() || "?"}
          </div>

          <div>
            <h1 className="font-bold text-gray-900">
              {user?.firstName || "Match"}
            </h1>

            <p className="text-xs text-gray-500">
              {user?.isOnline ? "Online" : "Offline"}
            </p>
          </div>

          <Heart className="ml-auto h-6 w-6 fill-rose-500 text-rose-500" />
        </div>
      </nav>

      {/* Messages */}
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
        <div className="flex-1 space-y-4 overflow-y-auto py-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {messages.length === 0 && !error && (
            <div className="py-20 text-center">
              <Heart className="mx-auto h-12 w-12 fill-rose-100 text-rose-400" />

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Start your conversation ❤️
              </h2>

              <p className="mt-2 text-gray-500">
                Say hello and get to know each other.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isMine = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isMine
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMine
                      ? "rounded-br-md bg-rose-500 text-white"
                      : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  <p className="text-sm">
                    {message.content}
                  </p>

                  <p
                    className={`mt-1 text-[10px] ${
                      isMine
                        ? "text-rose-100"
                        : "text-gray-400"
                    }`}
                  >
                    {new Date(
                      message.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message form */}
        <form
          onSubmit={sendMessage}
          className="border-t bg-gray-50 py-4"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Write a message..."
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />

            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}