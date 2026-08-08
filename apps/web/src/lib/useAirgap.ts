"use client";

import { useEffect, useState } from "react";

export interface AirgapState {
  /** null until the browser has been read on the client, to avoid a hydration mismatch. */
  online: boolean | null;
  /** Seconds since the browser last reported losing the network, or null if online. */
  darkForSeconds: number | null;
}

/**
 * Tracks whether the browser reports a network connection.
 *
 * `navigator.onLine` is honest about disconnection and optimistic about
 * connection: false reliably means no interface is up, but true only means an
 * interface exists, not that anything is reachable. The UI says "browser
 * reports no network" rather than claiming a verified airgap.
 */
export function useAirgap(): AirgapState {
  const [online, setOnline] = useState<boolean | null>(null);
  const [darkSince, setDarkSince] = useState<number | null>(null);
  const [darkForSeconds, setDarkForSeconds] = useState<number | null>(null);

  useEffect(() => {
    const sync = (isOnline: boolean) => {
      setOnline(isOnline);
      setDarkSince((current) => {
        if (isOnline) return null;
        return current ?? Date.now();
      });
    };

    sync(navigator.onLine);

    const handleOnline = () => sync(true);
    const handleOffline = () => sync(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (darkSince === null) {
      setDarkForSeconds(null);
      return;
    }
    const tick = () => setDarkForSeconds(Math.floor((Date.now() - darkSince) / 1000));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [darkSince]);

  return { online, darkForSeconds };
}
