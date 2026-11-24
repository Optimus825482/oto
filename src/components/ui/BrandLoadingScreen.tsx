"use client";

import React from "react";

interface BrandLoadingScreenProps {
  title?: string;
  subtitle?: string;
  badge?: string;
}

export function BrandLoadingScreen({
  title = "OtoBeyinPazari.com",
  subtitle = "Sistem hazırlanıyor, lütfen bekleyin...",
  badge = "TEST GARANTİLİ MERKEZİ TEDARİK",
}: BrandLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-[#0E315C] px-6 text-white"
    >
      {/* Subtle ECU circuit grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center text-center animate-obp-splash-in">
        {/* Orbiting orange ring around white logo tile */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
          <div className="animate-obp-orbit absolute inset-0 rounded-3xl border-2 border-transparent border-t-orange-500 border-r-orange-400/70" />
          <div className="absolute inset-2 rounded-2xl border border-white/15 bg-white p-3 shadow-2xl">
            <img
              src="/assets/logo-square.jpg"
              alt="OtoBeyinPazari.com"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-[11px] font-bold tracking-widest text-orange-300 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badge}
        </span>

        <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">{subtitle}</p>

        {/* Smooth indeterminate shimmer progress bar */}
        <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="animate-obp-shimmer h-full w-2/5 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}
