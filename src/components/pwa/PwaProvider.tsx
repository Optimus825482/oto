"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __obpDeferredPrompt?: BeforeInstallPromptEvent | null;
    MSStream?: unknown;
  }
}

interface PwaContextValue {
  canInstall: boolean;
  hasNativePrompt: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isOnline: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  requestNotificationPermission: (appTitle?: string) => Promise<NotificationPermission | "unsupported">;
  triggerInstall: (
    appTitle?: string
  ) => Promise<"accepted" | "dismissed" | "ios" | "unavailable">;
}

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  hasNativePrompt: false,
  isInstalled: false,
  isIos: false,
  isOnline: true,
  notificationPermission: "default",
  requestNotificationPermission: async () => "unsupported",
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
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent;
    const iosDetected = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIos(iosDetected);

    setIsOnline(window.navigator.onLine);

    if ("Notification" in window) {
      setNotificationPermission(window.Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }

    // Pick up any early beforeinstallprompt captured in <head> before hydration
    if (window.__obpDeferredPrompt) {
      setDeferredPrompt(window.__obpDeferredPrompt);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleInstallReady = () => {
      if (window.__obpDeferredPrompt) {
        setDeferredPrompt(window.__obpDeferredPrompt);
      }
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__obpDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__obpDeferredPrompt = null;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("obp-install-ready", handleInstallReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Non-fatal in restricted contexts
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("obp-install-ready", handleInstallReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const requestNotificationPermission = async (
    appTitle = "OtoBeyinPazari.com"
  ): Promise<NotificationPermission | "unsupported"> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const perm =
        window.Notification.permission === "default"
          ? await window.Notification.requestPermission()
          : window.Notification.permission;
      setNotificationPermission(perm);

      if (perm === "granted") {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg && "showNotification" in reg) {
          await reg.showNotification(`${appTitle} Bildirimleri Aktif`, {
            body: "Yeni beyin talepleri, tedarikçi teklifleri ve test sonuçları anlık olarak bildirilecektir.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/favicon-32x32.png",
            data: { url: window.location.pathname },
          });
        }
      }
      return perm;
    } catch {
      return window.Notification.permission;
    }
  };

  const triggerInstall = async (
    appTitle = "OtoBeyinPazari.com"
  ): Promise<"accepted" | "dismissed" | "ios" | "unavailable"> => {
    const promptEvent = deferredPrompt || window.__obpDeferredPrompt;

    // Request notification permission alongside install flow
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      window.Notification.permission === "default"
    ) {
      // Trigger permission right away if no native install prompt, or right after prompt resolves
      if (!promptEvent) {
        await requestNotificationPermission(appTitle);
      }
    }

    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        window.__obpDeferredPrompt = null;
        setIsInstalled(true);
        await requestNotificationPermission(appTitle);
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
        hasNativePrompt: Boolean(deferredPrompt),
        isInstalled,
        isIos,
        isOnline,
        notificationPermission,
        requestNotificationPermission,
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
