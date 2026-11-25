"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Cpu,
  PackageSearch,
  LogIn,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { QuickInquiryForm } from "@/components/storefront/QuickInquiryForm";
import {
  CatalogSection,
  type CatalogPartItem,
} from "@/components/storefront/CatalogSection";
import { HowItWorksSection } from "@/components/storefront/HowItWorksSection";
import { Footer } from "@/components/storefront/Footer";

const EIGHT_STEP_HIGHLIGHTS = [
  "1. Beyin / Şase Sorgusu",
  "2. Onaylı Ağa Yayın",
  "3. Gizli Teklif Toplama",
  "4. SMS ile Tek Fiyat",
  "5. Güvence Hesabı Ödemesi",
  "6. Merkeze Kargo Sevki",
  "7. Tezgâh Testi & E-Fatura",
  "8. Tek Tip Kargo & Teslimat",
];

function StorefrontContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category")?.toUpperCase() || "ALL";

  const [activeCategory, setActiveCategory] = useState<string>(initialCat);
  const [prefillPartCode, setPrefillPartCode] = useState<string>("");
  const [prefillCategory, setPrefillCategory] = useState<string>("ECU");
  const [prefillNonce, setPrefillNonce] = useState<number>(0);

  useEffect(() => {
    const cat = searchParams.get("category")?.toUpperCase();
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  function scrollToElement(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleSelectCategory(code: string) {
    setActiveCategory(code);
    scrollToElement("katalog");
  }

  function handleSelectPart(part: CatalogPartItem) {
    setPrefillPartCode(part.oemCode);
    setPrefillCategory(part.category || "ECU");
    setPrefillNonce((n) => n + 1);
    scrollToElement("hizli-talep");
  }

  function handleAskMissingPart(searchedCode: string, category: string) {
    setPrefillPartCode(searchedCode || "Katalog Dışı Parça Talebi");
    setPrefillCategory(category === "ALL" ? "ECU" : category);
    setPrefillNonce((n) => n + 1);
    scrollToElement("hizli-talep");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onJumpToInquiry={() => scrollToElement("hizli-talep")}
        onJumpToCatalog={() => scrollToElement("katalog")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        {/* Hero: Quick Inquiry Form + Trust Highlights */}
        <section className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/5 border border-navy-900/10 text-navy-900 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  Merkezi Tedarik • Test Garantili • Faturalı Oto Beyin Pazarı
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 tracking-tight leading-tight">
                Aracınız İçin Doğru Beyni{" "}
                <span className="text-orange-500">Test Onaylı</span> ve{" "}
                <span className="text-emerald-600">14 Gün Garantili</span>{" "}
                Tedarik Edin
              </h1>
            </div>

            <Link
              href="/takip/OBP-202603"
              className="inline-flex items-center gap-2 self-start lg:self-auto px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-400 text-xs font-bold text-navy-900 shadow-xs transition-colors"
            >
              <PackageSearch className="w-4 h-4 text-orange-500" />
              <span>Örnek Canlı Takip: OBP-202603</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Quick Inquiry Card */}
          <QuickInquiryForm
            prefillPartCode={prefillPartCode}
            prefillCategory={prefillCategory}
            prefillNonce={prefillNonce}
          />

          {/* 8-Step Highlights Strip */}
          <div className="bg-navy-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Uçtan Uca 8 Adım Güvenli Tedarik &amp; Laboratuvar Süreci</span>
              </div>
              <Link
                href="/takip"
                className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4"
              >
                Siparişimi Takip Et →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {EIGHT_STEP_HIGHLIGHTS.map((item) => (
                <div
                  key={item}
                  className="bg-navy-800/80 border border-navy-700/80 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-slate-100 flex items-center"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Catalog Section */}
        <CatalogSection
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onSelectPart={handleSelectPart}
          onAskMissingPart={handleAskMissingPart}
        />

        {/* How It Works, Standards & Dynamic Value-Add Services */}
        <HowItWorksSection />
      </main>

      {/* Corporate Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex items-center justify-around gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => scrollToElement("hizli-talep")}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl bg-navy-900 text-white text-[11px] font-bold cursor-pointer"
        >
          <Cpu className="w-4 h-4 text-orange-400" />
          <span>Hızlı Talep</span>
        </button>
        <Link
          href="/takip"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold"
        >
          <PackageSearch className="w-4 h-4 text-orange-500" />
          <span>Sipariş Takip</span>
        </Link>
        <Link
          href="/giris"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl bg-slate-100 text-navy-900 text-[11px] font-bold"
        >
          <LogIn className="w-4 h-4 text-slate-600" />
          <span>Giriş</span>
        </Link>
      </div>
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-navy-900">
          OtoBeyinPazari.com yükleniyor...
        </div>
      }
    >
      <StorefrontContent />
    </Suspense>
  );
}
