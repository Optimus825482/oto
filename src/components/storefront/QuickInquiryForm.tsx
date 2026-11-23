"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Cpu,
  CarFront,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  FileText,
  Layers,
  RotateCcw,
} from "lucide-react";
import { PART_CATEGORIES } from "@/types/domain";
import type { VinDecodeResult } from "@/lib/vin";

export interface QuickInquiryFormProps {
  prefillPartCode?: string;
  prefillCategory?: string;
  prefillNonce?: number;
}

interface CreatedInquiryResponse {
  code: string;
  status: string;
  partCode: string | null;
  vin: string | null;
  brand: string | null;
  category: string;
  createdAt: string;
}

export function QuickInquiryForm({
  prefillPartCode = "",
  prefillCategory = "ECU",
  prefillNonce = 0,
}: QuickInquiryFormProps) {
  const [customerPhone, setCustomerPhone] = useState("");
  const [partCode, setPartCode] = useState(prefillPartCode);
  const [vin, setVin] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [category, setCategory] = useState(prefillCategory || "ECU");
  const [note, setNote] = useState("");

  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinResult, setVinResult] = useState<VinDecodeResult | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdInquiry, setCreatedInquiry] =
    useState<CreatedInquiryResponse | null>(null);

  useEffect(() => {
    if (prefillPartCode) {
      setPartCode(prefillPartCode);
      setCreatedInquiry(null);
      setSubmitError(null);
    }
    if (prefillCategory && prefillCategory !== "ALL") {
      setCategory(prefillCategory);
    }
  }, [prefillPartCode, prefillCategory, prefillNonce]);

  async function handleDecodeVin(targetVin?: string) {
    const cleanVin = (targetVin ?? vin).trim().toUpperCase().replace(/\s+/g, "");
    setVinError(null);
    setVinResult(null);

    if (!cleanVin) {
      setVinError("Lütfen önce 17 haneli şase numaranızı (VIN) yazın.");
      return;
    }

    setVinDecoding(true);
    try {
      const res = await fetch("/api/vin/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: cleanVin }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setVinError(data.error || "Şase numarası doğrulanamadı.");
        return;
      }
      setVin(data.vin);
      setVinResult(data);
    } catch {
      setVinError("Şase çözümleme sırasında bağlantı hatası oluştu.");
    } finally {
      setVinDecoding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setSubmitError(
        "Lütfen geçerli bir cep telefonu numarası giriniz (ör. 0532 123 45 67)."
      );
      return;
    }

    if (!partCode.trim() && !vin.trim()) {
      setSubmitError(
        "Parça / Beyin numarası veya 17 haneli şase numarası (VIN) alanlarından en az birini doldurunuz."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim() || undefined,
          partCode: partCode.trim() || undefined,
          vin: vin.trim() || undefined,
          category: category || "ECU",
          brand: vinResult?.brand || undefined,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Talebiniz oluşturulurken hata oluştu.");
        return;
      }

      setCreatedInquiry(data.inquiry);
    } catch {
      setSubmitError(
        "Sunucuya bağlanırken bir sorun oluştu. Lütfen tekrar deneyiniz."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setCreatedInquiry(null);
    setPartCode("");
    setVin("");
    setNote("");
    setVinResult(null);
    setVinError(null);
    setSubmitError(null);
  }

  if (createdInquiry) {
    return (
      <div
        id="hizli-talep"
        className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                TALEP BAŞARIYLA ALINDI
              </span>
              <span className="text-xs text-slate-500 font-medium">
                SMS Bildirimi Gönderildi
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-navy-900">
              Takip Kodunuz:{" "}
              <span className="font-mono text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                {createdInquiry.code}
              </span>
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              Talebiniz onaylı tedarikçi ağımıza yönlendiriliyor,{" "}
              <strong className="text-navy-900">15-30 dk içinde</strong>{" "}
              SMS/WhatsApp ile test onaylı fiyat iletilecektir.
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              {createdInquiry.partCode && (
                <span>
                  Parça Kodu:{" "}
                  <strong className="font-mono text-navy-900">
                    {createdInquiry.partCode}
                  </strong>
                </span>
              )}
              {createdInquiry.vin && (
                <span>
                  • Şase (VIN):{" "}
                  <strong className="font-mono text-navy-900">
                    {createdInquiry.vin}
                  </strong>
                </span>
              )}
              {createdInquiry.brand && (
                <span>
                  • Marka:{" "}
                  <strong className="text-navy-900">
                    {createdInquiry.brand}
                  </strong>
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={`/takip/${createdInquiry.code}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold shadow-sm transition-colors"
              >
                <span>Canlı Sipariş / Talep Takibine Git</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeni Talep Oluştur</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="hizli-talep"
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      {/* Top Card Accent */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-5 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-400" />
            <span>Hızlı Beyin &amp; Şase (VIN) Sorgulama</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            50+ onaylı beyin tedarikçisinden tek tıkla gizli fiyat toplayalım,
            test edip faturalı gönderelim.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          15-30 Dk İçinde SMS Teklifi
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4">
        {submitError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Primary 2 Mockup Fields + VIN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="inquiry-phone"
              className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
            >
              Cep Telefonu Numaranız <span className="text-orange-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="inquiry-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inquiry-partcode"
              className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
            >
              Aradığınız Beyin Numarası / Ürün Adı
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="inquiry-partcode"
                type="text"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                placeholder="Örn: A646 150 00 00, 0AM927769D, EDC17"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-mono font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 17-Char VIN + Live Auto-Decode */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="inquiry-vin"
              className="text-xs font-bold text-navy-900 uppercase tracking-wide flex items-center gap-1.5"
            >
              <CarFront className="w-4 h-4 text-orange-500" />
              <span>17 Haneli Şase No (VIN — Opsiyonel)</span>
            </label>
            <span className="text-[11px] font-medium text-slate-500">
              {vin.trim().length}/17 karakter
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="inquiry-vin"
              type="text"
              maxLength={17}
              value={vin}
              onChange={(e) => {
                const next = e.target.value.toUpperCase();
                setVin(next);
                if (vinError) setVinError(null);
                if (vinResult && next.trim() !== vinResult.vin) {
                  setVinResult(null);
                }
              }}
              placeholder="Örn: WDF63960313482910 veya WVWZZZ3CZEE104829"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => handleDecodeVin()}
              disabled={vinDecoding}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer shrink-0"
            >
              {vinDecoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Çözümleniyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Şaseden Araç Çözümle</span>
                </>
              )}
            </button>
          </div>

          {vinError && (
            <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{vinError}</span>
            </p>
          )}

          {vinResult && vinResult.valid && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {vinResult.brand}
                {vinResult.modelYear ? ` • ${vinResult.modelYear}` : ""}
              </span>
              {vinResult.region && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-navy-900/10 text-navy-900 text-xs font-semibold">
                  Menşei: {vinResult.region}
                </span>
              )}
              {vinResult.suggestedEcuFamilies?.map((fam) => (
                <span
                  key={fam}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold"
                >
                  {fam}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Optional Fields: Name, Category, Note */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="inquiry-name"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Ad Soyad / Servis Adı (Opsiyonel)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="inquiry-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Örn: Ahmet Usta"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inquiry-category"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Parça Kategorisi
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="inquiry-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none text-sm text-slate-900 bg-white"
              >
                {PART_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="inquiry-note"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Not / Açıklama (Opsiyonel)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="inquiry-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn: Su almış, kodlanacak"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-xl bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
              <span>Talebiniz Oluşturuluyor...</span>
            </>
          ) : (
            <>
              <span>
                Sorgula / Talep Oluştur (SMS ile Bilgilendirileceksiniz)
              </span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
