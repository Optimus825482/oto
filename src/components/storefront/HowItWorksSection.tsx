"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Network,
  Microscope,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ReceiptText,
  RefreshCw,
  Cpu,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
} from "lucide-react";
import { formatTRY } from "@/types/domain";

export interface PublicSystemSettings {
  enableCoreExchange: boolean;
  coreDepositAmount: number;
  enableVinProgramming: boolean;
  vinProgrammingFee: number;
  enableB2bDealers: boolean;
  b2bDiscountPercent: number;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSystemSettings = {
  enableCoreExchange: true,
  coreDepositAmount: 1500,
  enableVinProgramming: true,
  vinProgrammingFee: 1500,
  enableB2bDealers: true,
  b2bDiscountPercent: 8,
};

export async function fetchPublicSettings(): Promise<PublicSystemSettings> {
  try {
    const res = await fetch("/api/settings/public", { cache: "no-store" });
    if (!res.ok) return DEFAULT_PUBLIC_SETTINGS;
    const data = await res.json();
    const raw = data?.settings ?? data;
    if (!raw || typeof raw !== "object") return DEFAULT_PUBLIC_SETTINGS;
    return {
      enableCoreExchange:
        typeof raw.enableCoreExchange === "boolean"
          ? raw.enableCoreExchange
          : DEFAULT_PUBLIC_SETTINGS.enableCoreExchange,
      coreDepositAmount:
        typeof raw.coreDepositAmount === "number"
          ? raw.coreDepositAmount
          : DEFAULT_PUBLIC_SETTINGS.coreDepositAmount,
      enableVinProgramming:
        typeof raw.enableVinProgramming === "boolean"
          ? raw.enableVinProgramming
          : DEFAULT_PUBLIC_SETTINGS.enableVinProgramming,
      vinProgrammingFee:
        typeof raw.vinProgrammingFee === "number"
          ? raw.vinProgrammingFee
          : DEFAULT_PUBLIC_SETTINGS.vinProgrammingFee,
      enableB2bDealers:
        typeof raw.enableB2bDealers === "boolean"
          ? raw.enableB2bDealers
          : DEFAULT_PUBLIC_SETTINGS.enableB2bDealers,
      b2bDiscountPercent:
        typeof raw.b2bDiscountPercent === "number"
          ? raw.b2bDiscountPercent
          : DEFAULT_PUBLIC_SETTINGS.b2bDiscountPercent,
    };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Şase veya Parça Kodu ile Sorgula",
    description:
      "17 haneli şase numaranızı (VIN) veya beyin üzerindeki Bosch, Siemens, Continental OEM kodunu girin; aracınıza birebir uyumlu modülü anında eşleştirelim.",
    badge: "Anında OEM Eşleştirme",
    icon: Search,
    accent: "bg-navy-900 text-white",
    ring: "border-navy-900/15",
  },
  {
    step: "02",
    title: "Kapalı Tedarik Ağımızdan En Uygun Fiyatı Alın",
    description:
      "Onaylı tedarikçilerimizden gelen gizli teklifler operasyon ekibimizce süzülür; size yalnızca tek, şeffaf ve test garantili fiyat sunulur.",
    badge: "Tek & Şeffaf Teklif",
    icon: Network,
    accent: "bg-orange-500 text-white",
    ring: "border-orange-200",
  },
  {
    step: "03",
    title: "Merkez Test Laboratuvarımızda Cihaz Testi & Mühür",
    description:
      "Seçilen beyin doğrudan müşteriye değil, önce merkez test laboratuvarımıza gelir; CAN/OBD haberleşme, pin ve yük testinden geçip hologramla mühürlenir.",
    badge: "Merkez Lab Onayı",
    icon: Microscope,
    accent: "bg-navy-800 text-white",
    ring: "border-navy-800/15",
  },
  {
    step: "04",
    title: "E-Faturalı Tek Tip Kargo & 14 Gün İade Güvencesi",
    description:
      "ESD anti-statik korumalı özel kutu, QR test sertifikası ve resmi E-Faturanızla adresinize sevk edilir. Ödemeniz 14 gün güvence hesabında korunur.",
    badge: "Güvence Hesabı",
    icon: PackageCheck,
    accent: "bg-emerald-600 text-white",
    ring: "border-emerald-200",
  },
];

const STANDARD_CARDS = [
  {
    code: "STD-01",
    title: "%100 Tezgâh Testi (CAN/OBD & Pin Kontrolü)",
    description:
      "Arızalı parça size hiç ulaşmadan merkezde elenir. Her ünite tezgâh simülatöründe haberleşme, besleme ve çıkış sinyali doğrulamasından geçer.",
    metric: "0 Hatalı Sevk Hedefi",
    icon: Microscope,
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-200",
    iconBg: "bg-orange-500 text-white",
  },
  {
    code: "STD-02",
    title: "Hologram Mühür & QR Dijital Sertifika",
    description:
      "Her beyin seri numarası ve doğrulanabilir QR test sertifikasıyla gelir. Mührü bozulmamış tüm ürünlerde tam garanti kapsamı geçerlidir.",
    metric: "Doğrulanabilir QR Kaydı",
    icon: QrCode,
    badgeColor: "bg-navy-900/10 text-navy-900 border-navy-900/20",
    iconBg: "bg-navy-900 text-white",
  },
  {
    code: "STD-03",
    title: "Tek Tip Anti-Statik (ESD) Kargolama & E-Fatura",
    description:
      "Hangi şehirden tedarik edilirse edilsin kurumsal fatura ve darbe korumalı kutu ile gönderilir. Statik elektrik hasarına karşı tam koruma sağlanır.",
    metric: "KDV Dahil Resmi Fatura",
    icon: ReceiptText,
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-600 text-white",
  },
  {
    code: "STD-04",
    title: "14 Gün Koşulsuz İade & Güvence Hesabı",
    description:
      "Uyumsuz parça durumunda kesintisiz iade koruması sunulur. Ödemeniz onay süreciniz tamamlanana kadar güvence hesabında blokeli tutulur.",
    metric: "14 Gün Tam Koruma",
    icon: ShieldCheck,
    badgeColor: "bg-orange-500/10 text-orange-700 border-orange-200",
    iconBg: "bg-navy-950 text-orange-400",
  },
];

export function HowItWorksSection() {
  const [settings, setSettings] = useState<PublicSystemSettings>(
    DEFAULT_PUBLIC_SETTINGS
  );

  useEffect(() => {
    let active = true;
    fetchPublicSettings().then((loaded) => {
      if (active) setSettings(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const hasAnyValueAdd =
    settings.enableCoreExchange ||
    settings.enableVinProgramming ||
    settings.enableB2bDealers;

  return (
    <section
      id="nasil-calisir"
      aria-labelledby="nasil-calisir-heading"
      className="space-y-10 scroll-mt-24"
    >
      {/* Part A — 4 Adımda Test Garantili Oto Beyin Nasıl Alınır? */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Şeffaf &amp; Merkezi Kalite Kontrol Süreci</span>
            </div>
            <h2
              id="nasil-calisir-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-navy-900 tracking-tight"
            >
              4 Adımda Test Garantili Oto Beyin Nasıl Alınır?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Klasik çıkma parça pazarındaki belirsizliği ortadan kaldırıyoruz.
              Her talep tek merkezden yönetilir, laboratuvar onayından geçer ve
              resmi fatura ile teslim edilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/#hizli-talep"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <span>Hemen Sorgu Başlat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/takip"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-navy-900 text-xs sm:text-sm font-bold transition-colors"
            >
              <span>Canlı Takip</span>
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {/* Desktop Connector Line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-11 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-navy-900/20 via-orange-400/50 to-emerald-500/40 pointer-events-none"
          />

          {PROCESS_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={`relative bg-slate-50/70 hover:bg-white rounded-2xl border ${item.ring} p-5 transition-all hover:shadow-md flex flex-col justify-between gap-4`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm relative z-10 ${item.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-slate-200 select-none">
                      {item.step}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-navy-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5 text-[11px] font-bold text-navy-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item.badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part B — Çalışma Prensiplerimiz & Güven Standartlarımız */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Lock className="w-3.5 h-3.5" />
              <span>Kurumsal Kalite Protokolü</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Çalışma Prensiplerimiz &amp; Güven Standartlarımız
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Türkiye&apos;nin her yerinden gelen onaylı stokları tek kalite
              standardında buluşturuyor, elektronik parça riskini sıfırlıyoruz.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold self-start sm:self-auto shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Kör Tedarik • Doğrudan Müşteri Gizliliği</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STANDARD_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.code}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-navy-800/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${card.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${card.badgeColor}`}
                    >
                      {card.code}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-navy-900 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {card.metric}
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Part C — Dynamic Value-Add Banner Strip */}
      {hasAnyValueAdd && (
        <div className="rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white p-5 sm:p-7 shadow-md border border-navy-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Katma Değerli Mühendislik &amp; Bayi Hizmetleri</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                Siparişinizi İhtiyacınıza Göre Özelleştirin
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              Aktif teknik servis opsiyonlarımız ödeme ve teklif adımında tek
              tıkla uygulanabilir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {settings.enableCoreExchange && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold">
                    -{formatTRY(settings.coreDepositAmount)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Eski Beyin İadesi (-{formatTRY(settings.coreDepositAmount)})
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Arızalı eski beyninizi merkezimize göndererek{" "}
                    <strong className="text-white">
                      {formatTRY(settings.coreDepositAmount)}
                    </strong>{" "}
                    tutarında core exchange iade avantajından yararlanın.
                  </p>
                </div>
              </div>
            )}

            {settings.enableVinProgramming && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 text-orange-300 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-extrabold">
                    +{formatTRY(settings.vinProgrammingFee)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Şaseye Göre Tak-Çalıştır Programlama (+
                    {formatTRY(settings.vinProgrammingFee)})
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Aracınızın şase (VIN) ve immobilizer verilerine göre
                    laboratuvarımızda önceden programlanır; aracınıza doğrudan
                    takıp çalıştırabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {settings.enableB2bDealers && (
              <div className="rounded-2xl bg-orange-500/15 border border-orange-400/35 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-extrabold">
                    %{settings.b2bDiscountPercent} B2B İskonto
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      Özel Servisler İçin %{settings.b2bDiscountPercent}{" "}
                      İskontolu B2B Bayilik
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      Oto elektrik ve özel servislere özel öncelikli tedarik,
                      kurumsal E-Fatura ve sabit iskonto ayrıcalığı.
                    </p>
                  </div>
                  <Link
                    href="/b2b-bayi"
                    className="inline-flex items-center justify-center gap-2 w-full px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>B2B Bayilik Başvurusu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
