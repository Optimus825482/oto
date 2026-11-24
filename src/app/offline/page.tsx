"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <img
          src="/assets/logo-main.jpg"
          alt="OtoBeyinPazari.com"
          className="mx-auto mb-6 h-12 w-auto object-contain"
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-extrabold text-navy-900">
          İnternet Bağlantısı Yok
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Şu anda çevrimdışı görünüyorsunuz. Bağlantınız geri geldiğinde kaldığınız
          sayfadan devam edebilirsiniz.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
          >
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
