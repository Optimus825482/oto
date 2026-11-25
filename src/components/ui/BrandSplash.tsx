"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function BrandSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [mode, setMode] = useState<"site" | "admin">("site");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname) return;

    // Skip splash on standalone preview/loading/certificate/print routes
    if (
      pathname.startsWith("/yukleniyor") ||
      pathname.startsWith("/sertifika") ||
      pathname.startsWith("/offline")
    ) {
      return;
    }

    const isAdminRoute = pathname.startsWith("/admin");
    const isStorefrontEntry = pathname === "/";

    if (!isAdminRoute && !isStorefrontEntry) {
      return;
    }

    const storageKey = isAdminRoute ? "obp_splash_admin_seen" : "obp_splash_site_seen";
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") {
        return;
      }
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage errors in private mode
    }

    setMode(isAdminRoute ? "admin" : "site");
    setFadingOut(false);
    setVisible(true);

    // Total duration: 3.0 seconds (2.45s visible + 0.55s smooth fade-out)
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 2450);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!visible) return null;

  const isAdmin = mode === "admin";

  return (
    <div
      role="presentation"
      onClick={() => {
        setFadingOut(true);
        window.setTimeout(() => setVisible(false), 250);
      }}
      className={`no-print fixed inset-0 z-[150] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-[#0E315C] px-6 text-white transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Subtle technical grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* Orange ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-orange-500/20 blur-3xl"
      />

      <div className="relative flex max-w-md flex-col items-center text-center animate-obp-splash-in">
        {/* Crisp white card with full horizontal brand logo */}
        <div className="relative mb-6 rounded-3xl border border-white/20 bg-white px-7 py-5 shadow-2xl ring-4 ring-orange-500/20">
          <img
            src="/assets/logo-main.jpg"
            alt="OtoBeyinPazari.com"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </div>

        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-3.5 py-1 text-[11px] font-bold tracking-widest text-orange-300 uppercase">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          {isAdmin
            ? "ADMİN & TEST OPERASYON MERKEZİ"
            : "TEST GARANTİLİ OTO BEYİN PLATFORMU"}
        </span>

        <p className="mt-1 text-sm font-medium text-slate-300">
          {isAdmin
            ? "Toplu RFQ, Test Laboratuvarı ve OEM Arşivi açılıyor..."
            : "%100 Cihaz Testi • Kurumsal E-Fatura • 14 Gün Güvence"}
        </p>

        {/* 3-second smooth progress bar */}
        <div className="mt-6 h-1.5 w-60 overflow-hidden rounded-full bg-white/15">
          <div className="animate-obp-progress h-full w-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}
