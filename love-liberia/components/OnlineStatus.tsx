"use client";

import { useEffect, useState } from "react";

export default function OnlineStatus({ isOnline }: { isOnline?: boolean }) {
  const [currentStatus, setCurrentStatus] = useState<boolean | null>(isOnline ?? null);

  useEffect(() => {
    if (isOnline !== undefined) {
      return;
    }

    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.user) setCurrentStatus(Boolean(data.user.isOnline));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isOnline]);

  const online = (isOnline ?? currentStatus) === true;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${online ? "border-green-500/30 bg-green-950/40 text-green-300" : "border-gray-600/40 bg-gray-800/60 text-gray-400"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green-400" : "bg-gray-500"}`} aria-hidden="true" />
      {online ? "Online" : "Offline"}
    </div>
  );
}
