"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  PackageSearch,
  HelpCircle,
  Handshake,
  LogIn,
  Cpu,
} from "lucide-react";
import { PART_CATEGORIES } from "@/types/domain";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

export interface HeaderProps {
  activeCategory?: string;
  onSelectCategory?: (categoryCode: string) => void;
  onJumpToInquiry?: () => void;
  onJumpToCatalog?: () => void;
}

export function Header({
  activeCategory = "ALL",
  onSelectCategory,
  onJumpToInquiry,
  onJumpToCatalog,
}: HeaderProps) {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-40 no-print">
      {/* Top Utility Strip */}
      <div className="bg-navy-950 text-slate-200 text-xs border-b border-navy-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium truncate">
              Test Garantili Merkezi Tedarik • 14 Gün Koşulsuz İade
            </span>
          </div>

          <nav
            aria-label="Hızlı erişim menüsü"
            className="flex items-center gap-3 sm:gap-5 shrink-0"
          >
            <Link
              href="/takip"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium"
            >
              <PackageSearch className="w-3.5 h-3.5 text-orange-400" />
              <span>Sipariş Takip</span>
            </Link>
            <Link
              href="/#nasil-calisir"
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Nasıl Çalışır?</span>
            </Link>
            <Link
              href="/tedarikci-basvuru"
              className="hidden md:inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium"
            >
              <Handshake className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tedarikçi Ol</span>
            </Link>
            <Link
              href="/giris"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xs:inline">Tedarikçi / Admin Giriş</span>
              <span className="xs:hidden">Giriş</span>
            </Link>
            <PwaInstallButton
              label="Uygulamayı Kur"
              appTitle="OtoBeyinPazari.com"
              variant="compact"
            />
          </nav>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg"
          >
            <img
              src="/assets/logo-main.jpg"
              alt="OtoBeyinPazari.com"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </Link>

          {/* Center: Quick Inquiry & Search Jump */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-center">
            {onJumpToInquiry ? (
              <button
                type="button"
                onClick={onJumpToInquiry}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-orange-400" />
                <span>Hızlı Beyin / Şase Sorgula</span>
              </button>
            ) : (
              <Link
                href="/#hizli-talep"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Cpu className="w-4 h-4 text-orange-400" />
                <span>Hızlı Beyin / Şase Sorgula</span>
              </Link>
            )}

            {onJumpToCatalog ? (
              <button
                type="button"
                onClick={onJumpToCatalog}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-navy-900 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:inline">Katalog Ara</span>
              </button>
            ) : (
              <Link
                href="/#katalog"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-navy-900 text-sm font-semibold transition-colors"
              >
                <Search className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:inline">Katalog Ara</span>
              </Link>
            )}
          </div>

          {/* Right: Güvenli Alışveriş Orange Shield Badge */}
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200/80 rounded-2xl px-3.5 py-2 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-extrabold tracking-wide text-navy-900 uppercase border-b border-orange-200 pb-0.5 mb-0.5">
                GÜVENLİ ALIŞVERİŞ
              </div>
              <p className="text-[11px] font-medium text-slate-700 leading-snug">
                14 Gün Koşulsuz İade • Ödemeniz Güvence Hesabında Tutulur •
                Uyumsuz Olması Halinde Kesintisiz İade
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orange Full-Width Category Navigation Bar (No Horizontal Scroll) */}
      <nav
        aria-label="Parça kategorileri"
        className="w-full bg-orange-500 text-white border-t border-orange-600/30"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-center xl:justify-between gap-1 py-1.5">
            {onSelectCategory ? (
              <button
                type="button"
                onClick={() => onSelectCategory("ALL")}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                  activeCategory === "ALL"
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-white hover:bg-orange-600"
                }`}
              >
                TÜMÜ
              </button>
            ) : (
              <Link
                href="/"
                className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-colors ${
                  activeCategory === "ALL"
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-white hover:bg-orange-600"
                }`}
              >
                TÜMÜ
              </Link>
            )}

            {PART_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.code;
              if (onSelectCategory) {
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => onSelectCategory(cat.code)}
                    className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? "bg-navy-900 text-white shadow-sm"
                        : "text-white hover:bg-orange-600"
                    }`}
                  >
                    {cat.shortLabel}
                  </button>
                );
              }
              return (
                <Link
                  key={cat.code}
                  href={`/?category=${cat.code}#katalog`}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-colors ${
                    isActive
                      ? "bg-navy-900 text-white shadow-sm"
                      : "text-white hover:bg-orange-600"
                  }`}
                >
                  {cat.shortLabel}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
