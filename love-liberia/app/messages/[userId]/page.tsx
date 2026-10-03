"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import OnlineStatus from "@/components/OnlineStatus";
import { CHAT_PHOTO_MAX_BYTES } from "@/lib/chat-photo";

async function prepareChatPhoto(file: File) {
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose a photo smaller than 12 MB.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Unable to prepare this photo.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.78));
  if (!compressed) throw new Error("Unable to prepare this photo.");
  if (compressed.size > CHAT_PHOTO_MAX_BYTES) throw new Error("This photo is too large to send. Choose a smaller image.");

  return new File([compressed], "chat-photo.webp", { type: "image/webp" });
}

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  hasImage?: boolean;
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    let disposed = false;
    let requestPending = false;

    async function loadChat(initial = false) {
      if (requestPending) return;
      requestPending = true;

      try {
        const response = await fetch(`/api/messages?userId=${userId}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          if (!disposed) setError(data.error || "Unable to load conversation.");
          return;
        }

        if (disposed) return;
        setCurrentUserId(data.currentUserId || "");
        setUser(data.user || null);
        setError("");
        setMessages((current) => {
          const messagesById = new Map(current.map((message) => [message.id, message]));
          for (const message of data.messages || []) messagesById.set(message.id, message);
          const updated = [...messagesById.values()]
            .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
            .slice(-50);
          if (updated.length === current.length && updated.every((message, index) => message.id === current[index].id && message.read === current[index].read && message.content === current[index].content)) {
            return current;
          }
          return updated;
        });
      } catch {
        if (!disposed) setError("Unable to connect to the server.");
      } finally {
        requestPending = false;
        if (initial && !disposed) setLoading(false);
      }
    }

    void loadChat(true);
    const pollingTimer = window.setInterval(() => {
      if (!document.hidden) void loadChat();
    }, 3000);

    return () => {
      disposed = true;
      window.clearInterval(pollingTimer);
    };
  }, [userId]);

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhoto = event.currentTarget.files?.[0];
    if (!selectedPhoto) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedPhoto.type)) {
      setError("Choose a JPG, PNG, or WEBP photo.");
      event.currentTarget.value = "";
      return;
    }

    setError("");
    setPreparingPhoto(true);
    try {
      const compressedPhoto = await prepareChatPhoto(selectedPhoto);
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to preview this photo."));
        reader.onerror = () => reject(new Error("Unable to preview this photo."));
        reader.readAsDataURL(compressedPhoto);
      });
      setPhoto(compressedPhoto);
      setPhotoPreviewUrl(previewUrl);
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Unable to prepare this photo.");
    } finally {
      setPreparingPhoto(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreviewUrl("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (preparingPhoto || (!trimmedContent && !photo)) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("receiverId", userId);
      formData.set("content", trimmedContent);
      if (photo) formData.set("photo", photo);

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send message.");
        return;
      }

      setMessages((current) => {
        const messagesById = new Map(current.map((message) => [message.id, message]));
        messagesById.set(data.message.id, data.message);
        return [...messagesById.values()]
          .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
          .slice(-50);
      });
      setContent("");
      clearPhoto();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
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
                  {message.hasImage && (
                    <Image
                      src={`/api/messages/${encodeURIComponent(message.id)}/image`}
                      alt="Photo shared in chat"
                      width={512}
                      height={512}
                      unoptimized
                      className="mb-2 h-auto max-h-80 w-full max-w-[min(70vw,28rem)] rounded-lg object-contain"
                    />
                  )}
                  {message.content && <p className="text-sm">{message.content}</p>}
                  <p className={`mt-1 text-[10px] ${isMine ? "text-rose-100" : "text-gray-500"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-gray-800 bg-gray-950 py-3 sm:py-4">
          {photoPreviewUrl && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-2">
              <Image src={photoPreviewUrl} alt="Selected photo preview" width={56} height={56} unoptimized className="h-14 w-14 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-300">Photo ready to share</span>
              <button type="button" aria-label="Remove selected photo" onClick={clearPhoto} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <label title="Attach a photo" className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-300 transition hover:bg-gray-800 hover:text-white">
              <ImagePlus className="h-5 w-5" />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Attach a photo"
                onChange={selectPhoto}
                className="sr-only"
              />
            </label>
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
              disabled={sending || preparingPhoto || (!content.trim() && !photo)}
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
