"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PackageSearch,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";

const DEMO_CODES = [
  {
    code: "OBP-202603",
    label: "OBP-202603",
    desc: "Test Onaylı & Kargoda (QR Sertifikalı)",
  },
  {
    code: "OBP-202602",
    label: "OBP-202602",
    desc: "Fiyat Sunuldu (Ödeme Bekliyor)",
  },
  {
    code: "OBP-202604",
    label: "OBP-202604",
    desc: "Test Laboratuvarında",
  },
];

export default function TrackingLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Lütfen talep veya sipariş takip kodunuzu giriniz (ör. OBP-202603).");
      return;
    }
    setError(null);
    router.push(`/takip/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-navy-900 px-6 sm:px-8 py-6 text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold">
                Canlı Talep &amp; Sipariş Takibi
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                SMS veya WhatsApp ile iletilen <strong className="text-white">OBP-XXXXXX</strong>{" "}
                takip kodunuzla 8 adımlı süreci anlık izleyin.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="tracking-code-input"
                className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-2"
              >
                Talep / Sipariş Kodu
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="tracking-code-input"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder="Örn: OBP-202603"
                  className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono text-base font-bold uppercase text-navy-900 placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <span>Sorgula</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Demo Shortcut Chips */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Hızlı Demo Takip Kodları</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_CODES.map((demo) => (
                  <button
                    key={demo.code}
                    type="button"
                    onClick={() => router.push(`/takip/${demo.code}`)}
                    className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer group"
                  >
                    <div className="font-mono text-sm font-extrabold text-navy-900 group-hover:text-orange-600">
                      {demo.label}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                      {demo.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tüm süreç OtoBeyinPazari güvencesi altındadır.
              </span>
              <Link
                href="/"
                className="font-semibold text-navy-900 hover:text-orange-600 underline underline-offset-4"
              >
                Yeni Parça Sorgula
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
