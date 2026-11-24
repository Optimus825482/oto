"use client";

import { useState } from "react";
import {
  Download,
  Bell,
  BellRing,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
} from "lucide-react";
import { usePwa } from "./PwaProvider";

interface PwaInstallButtonProps {
  label?: string;
  appTitle?: string;
  variant?: "light" | "dark" | "compact";
  className?: string;
}

export function PwaInstallButton({
  label = "Uygulamayı Kur",
  appTitle = "OtoBeyinPazari.com",
  variant = "light",
  className = "",
}: PwaInstallButtonProps) {
  const {
    hasNativePrompt,
    isInstalled,
    isIos,
    notificationPermission,
    requestNotificationPermission,
    triggerInstall,
  } = usePwa();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const baseStyles =
    variant === "dark"
      ? "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/15 px-3 py-2.5 text-xs font-bold text-orange-300 transition hover:bg-orange-500/25"
      : variant === "compact"
        ? "inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
        : "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100";

  // If already installed and notifications are already granted, hide cleanly
  if (isInstalled && notificationPermission === "granted") {
    return null;
  }

  // If already installed (or browser hasn't offered install prompt yet) and notifications aren't granted yet
  if (isInstalled && notificationPermission !== "granted") {
    return (
      <button
        type="button"
        onClick={async () => {
          const perm = await requestNotificationPermission(appTitle);
          if (perm === "granted") {
            setFeedback("Bildirimler açıldı!");
            setTimeout(() => setFeedback(null), 3000);
          }
        }}
        className={`${baseStyles} ${className}`}
      >
        <Bell className="h-3.5 w-3.5 shrink-0" />
        <span>{feedback || "Bildirimleri Aç"}</span>
      </button>
    );
  }

  const handleClick = async () => {
    const result = await triggerInstall(appTitle);

    if (result === "accepted") {
      setFeedback("Kurulum başlatıldı ✓");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (result === "ios") {
      setShowIosGuide(true);
      return;
    }

    // If browser already installed the app or hasn't fired beforeinstallprompt yet,
    // we already requested Notification permission above; give concise inline feedback (no annoying modal!)
    if (result === "unavailable") {
      setFeedback(
        notificationPermission === "granted"
          ? "Adres çubuğundan kurabilirsiniz"
          : "Bildirim izni istendi ✓"
      );
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${baseStyles} ${className}`}
        title={
          hasNativePrompt
            ? `${appTitle} — Tek tıkla kur ve bildirimleri aç`
            : `${appTitle} — Uygulamayı kur ve bildirimleri aç`
        }
      >
        {feedback ? (
          <BellRing className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Download className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{feedback || label}</span>
      </button>

      {/* Only shown on iOS Safari where Apple requires manual Share -> Add to Home Screen */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192x192.png"
                  alt={appTitle}
                  className="h-12 w-12 rounded-xl border border-slate-200 object-contain p-1"
                />
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">
                    {appTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    iPhone / iPad Ana Ekrana Ekleme
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-5 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <span>
                  Safari alt çubuğundaki <strong>Paylaş</strong> simgesine
                  dokunun.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <span>
                  Aşağı kaydırıp <strong>Ana Ekrana Ekle</strong> seçeneğine
                  dokunun.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Sağ üstten <strong>Ekle</strong> diyerek tam ekran kullanın ve
                  bildirimleri açın.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-xl bg-navy-900 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
