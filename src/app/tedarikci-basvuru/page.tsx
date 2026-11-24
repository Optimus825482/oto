"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  FileText,
  Lock,
  EyeOff,
  Wallet,
  Award,
  Truck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";

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

const MONTHLY_STOCK_OPTIONS = [
  { value: "10-50", label: "10 - 50 Adet / Ay" },
  { value: "50-200", label: "50 - 200 Adet / Ay" },
  { value: "200+", label: "200+ Adet / Ay" },
];

export default function SupplierApplicationPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [specialtyBrands, setSpecialtyBrands] = useState<string[]>([]);
  const [monthlyStock, setMonthlyStock] = useState("10-50");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function toggleBrand(brand: string) {
    setSpecialtyBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Lütfen firma adını giriniz.");
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
      const res = await fetch("/api/applications/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim(),
          district: district.trim() || undefined,
          specialtyBrands,
          monthlyStock,
          note: note.trim() || undefined,
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
        {!submitted ? (
          /* STAGE 1: Gated Supplier Application */
          <div className="space-y-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white p-6 sm:p-10 shadow-xl border border-navy-800">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kapalı Ağ Tedarikçi Başvurusu</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                  Onaylı Tedarikçi Ağına Katılın — Kapalı Ağ Çalışma Modelimizi
                  Görmek İçin Bilgilerinizi Girin
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  OtoBeyinPazari yalnızca doğrulanmış elektronik parça ve beyin
                  tedarikçileriyle kapalı devre çalışır. Başvuru formunu
                  tamamladığınız anda iş modelimiz ve hakediş akışımız hemen
                  açılır.
                </p>

                {/* Short Trust Badges */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>Sıfır İlan Ücreti</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Hazır Ödemeli Sipariş</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white">
                    <Wallet className="w-4 h-4 text-orange-400" />
                    <span>Hızlı Cari Hakediş</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Card + Locked Preview Teaser */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={handleSubmit}
                className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-navy-900">
                    Tedarikçi Ön Başvuru Formu
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Bilgilerinizi gönderdikten hemen sonra{" "}
                    <strong className="text-navy-900">
                      Kapalı Ağ Çalışma Modeli
                    </strong>{" "}
                    ekranı kilidi açılacaktır.
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
                      htmlFor="company-name"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-orange-500" />
                        Firma Adı *
                      </span>
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Örn: Yıldız Oto Beyin & Elektronik"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        Yetkili Ad Soyad *
                      </span>
                    </label>
                    <input
                      id="contact-name"
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
                      htmlFor="phone"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-orange-500" />
                        Cep Telefonu *
                      </span>
                    </label>
                    <input
                      id="phone"
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
                      htmlFor="email"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        E-Posta (Opsiyonel)
                      </span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@firma.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        Şehir *
                      </span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Örn: İstanbul, Ankara, Bursa"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                    >
                      Sanayi Sitesi / İlçe (Opsiyonel)
                    </label>
                    <input
                      id="district"
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Örn: İkitelli OSB / Atatürk Oto Sanayi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Specialty Brands */}
                <div>
                  <span className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-2">
                    Uzmanlık Markaları (Çoklu Seçim)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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

                {/* Monthly Stock */}
                <div>
                  <span className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      Tahmini Aylık Beyin Stoğu
                    </span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MONTHLY_STOCK_OPTIONS.map((opt) => {
                      const selected = monthlyStock === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMonthlyStock(opt.value)}
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

                {/* Note */}
                <div>
                  <label
                    htmlFor="note"
                    className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Not (Opsiyonel)
                    </span>
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Örn: Bosch EDC16/EDC17 ve DSG mekatronik stoğumuz güçlüdür..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Başvurunuz Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Başvuruyu Gönder &amp; Çalışma Modelini Gör</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Right Sidebar: Locked Model Teaser */}
              <aside className="lg:col-span-4 space-y-4">
                <div className="bg-navy-900 text-white rounded-3xl p-6 space-y-4 shadow-md border border-navy-800">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400/30 text-orange-400 flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold">
                    Kapalı Ağ Çalışma Modeli Kilitli
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Tedarikçi ağımızın fiyat koruma, gizli teklif, hazır ödemeli
                    sipariş ve test laboratuvarı hakediş detayları yalnızca
                    başvuru formunu dolduran adaylarımıza açılmaktadır.
                  </p>
                  <div className="pt-2 border-t border-navy-800 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>5 Adımlı Tedarikçi Gelir &amp; Hakediş Akışı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Gizli Teklif (Fiyat Kırma Olmayan) İhale Yapısı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Anlaşmalı Kargo &amp; Test Sonrası Cari Ödeme</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Zaten Onaylı Tedarikçi misiniz?
                  </div>
                  <Link
                    href="/giris"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 text-sm font-bold transition-colors"
                  >
                    <span>Tedarikçi Paneline Giriş Yap</span>
                    <ArrowRight className="w-4 h-4 text-orange-500" />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* STAGE 2: Unlocked Business Model Reveal */
          <div className="space-y-8">
            {/* Green Confirmation Banner */}
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold tracking-wide">
                  BAŞVURUNUZ KAYDEDİLDİ • KİLİT AÇILDI
                </span>
                <p className="text-base sm:text-lg font-semibold text-emerald-950 leading-snug">
                  Başvurunuz alındı! Aşağıda yalnızca onaylı tedarikçi
                  adaylarımıza açılan{" "}
                  <strong className="font-extrabold text-emerald-900">
                    Kapalı Ağ Çalışma Modelimiz
                  </strong>{" "}
                  yer almaktadır.
                </p>
                <p className="text-xs sm:text-sm text-emerald-800">
                  Yetkili ekibimiz{" "}
                  <strong>{companyName}</strong> ({city}) başvurunuzu inceleyip
                  en kısa sürede <strong>{phone}</strong> üzerinden sizinle
                  iletişime geçecektir.
                </p>
              </div>
            </div>

            {/* Business Model Header */}
            <section className="bg-navy-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
              <div className="max-w-3xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  OtoBeyinPazari Tedarikçi İş Modeli
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  Türkiye&apos;nin İlk Test Garantili Kapalı Ağ Beyin Tedarik
                  Sistemi Nasıl Çalışır?
                </h1>
                <p className="text-sm text-slate-300">
                  Stok yükleme veya telefonla pazarlık trafiği olmadan, sadece
                  elinizdeki gerçek parçaya kesin ödemeli sipariş alın.
                </p>
              </div>

              {/* 5 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    1. Sıfır İlan &amp; Stok Girişi Zahmeti
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Eski ilan güncelleme yok; sadece uzman olduğunuz
                    markalardan gerçek alıcı talebi (RFQ) telefonunuza/panelinize
                    düşer.
                  </p>
                </div>

                <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    2. Gizli Teklif &amp; Sıfır Fiyat Kırma Savaşı
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Rakipleriniz verdiğiniz fiyatı görmez; sadece en uygun &amp;
                    güvenilir tedarikçi seçilir.
                  </p>
                </div>

                <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    3. Ödemesi Alınmış Kesin Sipariş
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Müşteri ödemeyi güvence hesabına yatırdıktan sonra size hazır
                    anlaşmalı kargo barkodu gelir.
                  </p>
                </div>

                <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    4. Merkez Testi &amp; Hızlı Hakediş
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Beyin merkezimizde testten geçtiği an hakedişiniz cari
                    hesabınıza işlenir ve düzenli ödenir.
                  </p>
                </div>

                <div className="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-3 md:col-span-2 lg:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                    <Award className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    5. Kalite Puanı Önceliği
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Sağlam parça gönderen tedarikçiler toplu taleplerde öncelik
                    kazanır. Merkez laboratuvarımızdan yüksek başarı oranıyla
                    geçen tedarikçilerimiz daha fazla RFQ ve öncelikli hakediş
                    avantajlarından faydalanır.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-navy-800">
                <Link
                  href="/giris"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-extrabold shadow-md transition-colors"
                >
                  <span>Onaylı Tedarikçiyim — Panele Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
                >
                  <span>Ana Sayfaya Dön</span>
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
