"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Microscope,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
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

const TRUST_CARDS = [
  {
    title: "Tezgâh Testi & QR Sertifika",
    description:
      "Her beyin müşteriye çıkmadan merkez laboratuvarımızda CAN/OBD haberleşme, pin ve fiziksel testten geçer; QR sertifikasıyla mühürlenir.",
    icon: Microscope,
    accent: "bg-orange-500 text-white",
  },
  {
    title: "Tek Tip Anti-Statik Kargo",
    description:
      "Tüm gönderiler ESD korumalı özel oto beyin kutusunda, darbe emici sünger ve hologramlı güvenlik bandıyla merkezden sevk edilir.",
    icon: PackageCheck,
    accent: "bg-navy-900 text-white",
  },
  {
    title: "Kurumsal E-Fatura & E-Arşiv",
    description:
      "Bireysel müşteriler için E-Arşiv, servisler ve işletmeler için KDV dahil resmi Kurumsal E-Fatura otomatik olarak düzenlenir.",
    icon: ReceiptText,
    accent: "bg-emerald-600 text-white",
  },
  {
    title: "14 Gün Koşulsuz Güvence",
    description:
      "Ödemeniz güvence hesabında korunur. Uyumsuz çıkması veya arıza durumunda 14 gün içinde kesintisiz iade garantisi sunulur.",
    icon: ShieldCheck,
    accent: "bg-orange-600 text-white",
  },
];

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

        {/* Neden OtoBeyinPazari? 4-Card Trust Bar */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
                Neden OtoBeyinPazari.com?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Belirsiz çıkma parça alışverişini şeffaf, testli ve kurumsal
                standartlara taşıyoruz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${card.accent}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy-900">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/logo-main.jpg"
              alt="OtoBeyinPazari.com"
              className="h-10 w-auto rounded-lg bg-white p-1 object-contain"
            />
            <div className="text-xs">
              <div className="font-bold text-white">OtoBeyinPazari.com</div>
              <div className="text-slate-400">
                Test Garantili &amp; Merkezi Tedarikli Oto Elektronik Platformu
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold">
            <Link href="/takip" className="hover:text-orange-400 transition-colors">
              Sipariş Takip
            </Link>
            <Link href="/sunum" className="hover:text-orange-400 transition-colors">
              Proje Sunumu
            </Link>
            <Link href="/giris" className="hover:text-orange-400 transition-colors">
              Tedarikçi / Admin Giriş
            </Link>
          </div>
        </div>
      </footer>

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
