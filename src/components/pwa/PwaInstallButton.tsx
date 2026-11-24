"use client";

import { useState } from "react";
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from "lucide-react";
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
  const { isInstalled, isIos, triggerInstall } = usePwa();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    const result = await triggerInstall();
    if (result === "ios" || result === "unavailable") {
      setShowGuideModal(true);
    }
  };

  const baseStyles =
    variant === "dark"
      ? "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/15 px-3 py-2.5 text-xs font-bold text-orange-300 transition hover:bg-orange-500/25"
      : variant === "compact"
        ? "inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
        : "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${baseStyles} ${className}`}
        title={`${appTitle} — Uygulama olarak kur`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setShowGuideModal(false)}
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
                    Uygulama (PWA) Olarak Kurulum
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIos ? (
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
                    Sağ üstten <strong>Ekle</strong> diyerek uygulamayı tam
                    ekran kullanın.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  <p className="text-xs leading-relaxed">
                    <strong>Chrome / Edge (Masaüstü &amp; Android):</strong>{" "}
                    Adres çubuğunun sağındaki{" "}
                    <strong>Uygulamayı Yükle</strong> simgesine veya tarayıcı
                    menüsünden <strong>Ana Ekrana Ekle / Uygulama Yükle</strong>{" "}
                    seçeneğine tıklayarak bu paneli bağımsız uygulama olarak
                    kurabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full rounded-xl bg-navy-900 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
