"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Percent,
  Microscope,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  ReceiptText,
  ArrowRight,
  Loader2,
  AlertCircle,
  PauseCircle,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";

interface PublicSettings {
  enableB2bDealers: boolean;
  b2bDiscountPercent: number;
}

const SPECIALTY_BRAND_OPTIONS = [
  "Mercedes-Benz",
  "BMW",
  "VW/Audi",
  "Renault/Dacia",
  "Fiat",
  "Ford",
  "Opel",
  "Peugeot/Citroën",
  "Hyundai/Kia",
  "Toyota/Honda",
  "Ağır Vasıta",
];

const MONTHLY_VOLUME_OPTIONS = [
  { value: "1-5", label: "1 - 5 Adet / Ay" },
  { value: "5-15", label: "5 - 15 Adet / Ay" },
  { value: "15+", label: "15+ Adet / Ay" },
];

export default function B2BDealerPage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [serviceName, setServiceName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("5-15");
  const [specialtyBrands, setSpecialtyBrands] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/settings/public");
        if (!res.ok) {
          if (!cancelled) {
            setSettings({ enableB2bDealers: true, b2bDiscountPercent: 8 });
          }
          return;
        }
        const json = await res.json();
        const s = json.settings ?? json;
        if (!cancelled) {
          setSettings({
            enableB2bDealers: Boolean(s?.enableB2bDealers ?? true),
            b2bDiscountPercent: Number(s?.b2bDiscountPercent ?? 8),
          });
        }
      } catch {
        if (!cancelled) {
          setSettings({ enableB2bDealers: true, b2bDiscountPercent: 8 });
        }
      } finally {
        if (!cancelled) {
          setLoadingSettings(false);
        }
      }
    }
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleBrand(brand: string) {
    setSpecialtyBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!serviceName.trim()) {
      setError("Lütfen servis / işletme adını giriniz.");
      return;
    }
    if (!contactName.trim()) {
      setError("Lütfen yetkili ad soyad bilgisini giriniz.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Lütfen geçerli bir cep telefonu numarası giriniz.");
      return;
    }
    if (!city.trim()) {
      setError("Lütfen şehir bilgisini giriniz.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim(),
          taxNumber: taxNumber.trim() || undefined,
          monthlyVolume,
          specialtyBrands,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Başvuru gönderilirken bir hata oluştu.");
        return;
      }

      setSubmitted(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Sunucuyla iletişim kurulamadı. Lütfen tekrar deneyiniz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loadingSettings ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-14 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-medium">
              B2B Bayi programı bilgileri yükleniyor...
            </span>
          </div>
        ) : settings && !settings.enableB2bDealers ? (
          /* Paused State */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <PauseCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              B2B Bayi Başvuruları Geçici Olarak Durdurulmuştur
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Özel oto servisleri için B2B Bayi &amp; Cari kayıt alımlarımız şu
              an için kapasite optimizasyonu nedeniyle geçici olarak kapalıdır.
              Bireysel veya servis talepleriniz için ana sayfamızdan anında
              beyin / şase sorgulaması yapabilirsiniz.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors"
              >
                <span>Ana Sayfaya Dön</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero */}
            <section className="rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white p-6 sm:p-10 shadow-xl border border-navy-800">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Kurumsal Servis Ortaklığı</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                  Özel Oto Servisleri İçin B2B Bayi &amp; Cari Programı
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Aracın lifte takılı kalma süresini kısaltın. Onaylı özel
                  servis bayilerimize özel{" "}
                  <strong className="text-orange-400 font-extrabold">
                    %{settings?.b2bDiscountPercent ?? 8} servis iskontosu
                  </strong>
                  , öncelikli test laboratuvarı sırası ve aylık kurumsal e-fatura
                  ayrıcalıklarıyla güvenle parça tedarik edin.
                </p>
              </div>

              {/* 4 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-extrabold">
                    %{settings?.b2bDiscountPercent ?? 8} Özel Servis İskontosu
                  </div>
                  <p className="text-xs text-slate-300">
                    Tüm test onaylı ECU, TCU, ABS ve BCM siparişlerinizde anında
                    bayi indirimi.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-extrabold">
                    Öncelikli Test Lab Sırası
                  </div>
                  <p className="text-xs text-slate-300">
                    B2B servis talepleriniz merkez CAN/OBD test tezgâhında
                    öncelikli işleme alınır.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-extrabold">
                    Aylık Kurumsal E-Fatura
                  </div>
                  <p className="text-xs text-slate-300">
                    Şirketinize özel KDV dahil resmi kurumsal e-fatura ve cari
                    mutabakat desteği.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-extrabold">
                    14 Gün İade Garantisi
                  </div>
                  <p className="text-xs text-slate-300">
                    Araca uyumsuzluk halinde hologram mührü bozulmamış tüm
                    modüllerde kesintisiz iade.
                  </p>
                </div>
              </div>
            </section>

            {submitted ? (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-950">
                  B2B Bayi Başvurunuz Alındı!
                </h2>
                <p className="text-sm sm:text-base text-emerald-900">
                  <strong>{serviceName}</strong> ({city}) için yaptığınız
                  kurumsal bayi başvurusu B2B ekibimize iletilmiştir. Cari hesap
                  ve{" "}
                  <strong>
                    %{settings?.b2bDiscountPercent ?? 8} servis iskontosu
                  </strong>{" "}
                  tanımlaması için <strong>{phone}</strong> numarasından
                  tarafınıza dönüş yapılacaktır.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors"
                  >
                    <span>Ana Sayfaya Dön</span>
                    <ArrowRight className="w-4 h-4 text-orange-400" />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-navy-900">
                    B2B Servis Bayiliği Başvuru Formu
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Özel servis veya oto elektrik/elektronik atölyenizi
                    kaydedin, kurumsal cari avantajlardan yararlanın.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="service-name"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-orange-500" />
                        Servis / İşletme Adı *
                      </span>
                    </label>
                    <input
                      id="service-name"
                      type="text"
                      required
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Örn: Şahin Özel Oto Servis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="b2b-contact"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        Yetkili Ad Soyad *
                      </span>
                    </label>
                    <input
                      id="b2b-contact"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="b2b-phone"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-orange-500" />
                        Cep Telefonu *
                      </span>
                    </label>
                    <input
                      id="b2b-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="b2b-email"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        E-Posta (Opsiyonel)
                      </span>
                    </label>
                    <input
                      id="b2b-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="servis@ornek.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="b2b-city"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        Şehir *
                      </span>
                    </label>
                    <input
                      id="b2b-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Örn: İstanbul, İzmir, Ankara"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="b2b-tax"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                        Vergi Numarası (Opsiyonel)
                      </span>
                    </label>
                    <input
                      id="b2b-tax"
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="10 veya 11 haneli VKN / TCKN"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Monthly Volume */}
                <div>
                  <span className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-2">
                    Aylık Ortalama Beyin / Modül Talebi
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MONTHLY_VOLUME_OPTIONS.map((opt) => {
                      const selected = monthlyVolume === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMonthlyVolume(opt.value)}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            selected
                              ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specialty Brands */}
                <div>
                  <span className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-2">
                    Servis Verilen Ana Markalar
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SPECIALTY_BRAND_OPTIONS.map((brand) => {
                      const checked = specialtyBrands.includes(brand);
                      return (
                        <label
                          key={brand}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                            checked
                              ? "border-orange-500 bg-orange-50 text-navy-900 ring-1 ring-orange-500/30"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBrand(brand)}
                            className="accent-orange-500 w-4 h-4 rounded"
                          />
                          <span>{brand}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Başvuru Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>B2B Bayi Başvurusunu Gönder</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
