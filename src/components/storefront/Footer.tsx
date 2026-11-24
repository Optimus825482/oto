"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Microscope,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Building2,
  Handshake,
  LogIn,
} from "lucide-react";
import {
  DEFAULT_PUBLIC_SETTINGS,
  fetchPublicSettings,
  type PublicSystemSettings,
} from "@/components/storefront/HowItWorksSection";

const FOOTER_CATEGORIES = [
  { label: "Motor Beyni ECU", href: "/?category=ECU#katalog" },
  { label: "Şanzıman Beyni TCU", href: "/?category=TCU#katalog" },
  { label: "ABS / ESP Beyni", href: "/?category=ABS#katalog" },
  { label: "Konfor Beyni BCM/BSI", href: "/?category=BCM#katalog" },
  { label: "Airbag Beyni SRS", href: "/?category=SRS#katalog" },
  { label: "EPS & AdBlue Modülleri", href: "/?category=OTHER#katalog" },
];

export function Footer() {
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

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 mt-14 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1 — Marka & Güven */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex bg-white rounded-xl p-2 shadow-sm hover:opacity-95 transition-opacity"
            >
              <img
                src="/assets/logo-main.jpg"
                alt="OtoBeyinPazari.com"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              Türkiye&apos;nin test garantili, merkezi tedarikli, kurumsal
              E-Faturalı ve tek tip ESD kargolamalı profesyonel oto elektronik
              ve beyin tedarik platformu.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>14 Gün Güvence Hesabı</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-300 text-[11px] font-bold">
                <Microscope className="w-3.5 h-3.5 text-orange-400" />
                <span>%100 Cihaz Test Garantisi</span>
              </span>
            </div>
          </div>

          {/* Col 2 — Hızlı Erişim */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Hızlı Erişim
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/#hizli-talep"
                  className="hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500/80" />
                  <span>Hızlı Beyin / Şase Sorgu</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#katalog"
                  className="hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500/80" />
                  <span>OEM Parça Kataloğu</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#nasil-calisir"
                  className="hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500/80" />
                  <span>Çalışma Prensiplerimiz</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/takip"
                  className="hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500/80" />
                  <span>Canlı Sipariş Takip</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 — Ana Kategoriler */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Ana Kategoriler
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.label}>
                  <Link
                    href={cat.href}
                    className="hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/70" />
                    <span>{cat.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — İş Ortaklığı & Destek */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              İş Ortaklığı &amp; Destek
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/tedarikci-basvuru"
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span className="inline-flex items-center gap-2">
                  <Handshake className="w-4 h-4" />
                  <span>Tedarikçi Olmak İstiyorum</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {settings.enableB2bDealers && (
                <Link
                  href="/b2b-bayi"
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700 text-white text-xs font-bold transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Özel Servis B2B Başvurusu</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}

              <Link
                href="/giris"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400" />
                <span>Tedarikçi / Admin Girişi</span>
              </Link>
            </div>

            <div className="pt-2 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  İkitelli OSB Test &amp; Operasyon Merkezi / İstanbul
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  0850 300 45 00
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Pzt – Cmt: 08:30 – 18:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-navy-800/80 bg-navy-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>© 2026 OtoBeyinPazari.com — Tüm Hakları Saklıdır.</div>
          <div className="font-medium text-slate-300 text-center">
            Güvenli 3D Ödeme • Kurumsal E-Fatura • 14 Gün Koşulsuz İade
          </div>
        </div>
      </div>
    </footer>
  );
}
