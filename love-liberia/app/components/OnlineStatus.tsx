"use client";

import { useEffect, useState, useRef } from "react";

type OnlineStatusProps = {
  isOnline?: boolean;
};

export default function OnlineStatus({ isOnline }: OnlineStatusProps) {
  const [connected, setConnected] = useState(true);
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    const updateStatus = async (online: boolean) => {
      setConnected(online);

      if (!online) {
        return;
      }

      try {
        await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline: true }),
        });
      } catch {
        setConnected(false);
      }
    };

    void updateStatus(true);

    heartbeatRef.current = window.setInterval(() => {
      void updateStatus(true);
    }, 30_000);

    const handleOnline = () => void updateStatus(true);
    const handleOffline = () => updateStatus(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void updateStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      if (!navigator.onLine) {
        return;
      }
      navigator.sendBeacon(
        "/api/status",
        new Blob([JSON.stringify({ isOnline: false })], {
          type: "application/json",
        })
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (typeof isOnline !== "boolean") {
    return null;
  }

  const status = connected && isOnline;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${status ? "bg-green-500" : "bg-gray-500"}`}
      />
      {status ? "Online" : "Offline"}
    </span>
  );
}
