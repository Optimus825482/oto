"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isOnline: boolean;
  triggerInstall: () => Promise<"accepted" | "dismissed" | "ios" | "unavailable">;
}

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  isInstalled: false,
  isIos: false,
  isOnline: true,
  triggerInstall: async () => "unavailable",
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent;
    const iosDetected =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIos(iosDetected);

    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Non-fatal in restricted/private contexts
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<
    "accepted" | "dismissed" | "ios" | "unavailable"
  > => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return choice.outcome;
    }
    if (isIos && !isInstalled) {
      return "ios";
    }
    return "unavailable";
  };

  return (
    <PwaContext.Provider
      value={{
        canInstall: Boolean(deferredPrompt) || (isIos && !isInstalled),
        isInstalled,
        isIos,
        isOnline,
        triggerInstall,
      }}
    >
      {children}
      {!isOnline && (
        <div
          role="status"
          className="no-print fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy-950 px-4 py-2 text-xs font-semibold text-white shadow-lg ring-1 ring-orange-500/40"
        >
          <WifiOff className="h-3.5 w-3.5 text-orange-400" />
          <span>Çevrimdışı mod — Önbellekteki veriler gösteriliyor</span>
        </div>
      )}
    </PwaContext.Provider>
  );
}
