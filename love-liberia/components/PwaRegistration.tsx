"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => void registration.unregister());
        });
      }
      return;
    }

    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
