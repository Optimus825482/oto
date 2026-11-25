"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileText,
  Loader2,
  Send,
  Truck,
  X,
} from "lucide-react";
import { PART_CATEGORIES } from "@/types/domain";

export interface SupplierMyOffer {
  id: string;
  inquiryId: string;
  supplierId: string;
  purchasePrice: number;
  shippingDays: number;
  conditionNote: string;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRfqItem {
  id: string;
  code: string;
  partCode: string | null;
  vin: string | null;
  decodedVehicleJson: {
    brand?: string;
    modelYear?: number;
    region?: string;
  } | null;
  category: string;
  brand: string | null;
  note: string | null;
  status: string;
  broadcastedAt: string | null;
  createdAt: string;
  myOffer: SupplierMyOffer | null;
}

interface RfqOfferModalProps {
  rfq: SupplierRfqItem | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const SHIPPING_OPTIONS = [
  { days: 1, label: "Bugün Kargo", sub: "1 İş Günü" },
  { days: 2, label: "Yarın Kargo", sub: "2 İş Günü" },
  { days: 3, label: "2-3 Gün", sub: "2-3 İş Günü" },
];

export default function RfqOfferModal({
  rfq,
  onClose,
  onSubmitted,
}: RfqOfferModalProps) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [shippingDays, setShippingDays] = useState<number>(1);
  const [conditionNote, setConditionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rfq) return;
    if (rfq.myOffer) {
      setPurchasePrice(String(rfq.myOffer.purchasePrice));
      setShippingDays(rfq.myOffer.shippingDays || 1);
      setConditionNote(rfq.myOffer.conditionNote || "");
    } else {
      setPurchasePrice("");
      setShippingDays(1);
      setConditionNote("");
    }
    setError(null);
  }, [rfq]);

  useEffect(() => {
    if (!rfq) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rfq, submitting, onClose]);

  if (!rfq) return null;

  const categoryLabel =
    PART_CATEGORIES.find((c) => c.code === rfq.category)?.label || rfq.category;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rfq) return;

    const numericPrice = Number(purchasePrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Lütfen 0'dan büyük geçerli bir tedarik fiyatı giriniz.");
      return;
    }
    if (conditionNote.trim().length < 3) {
      setError("Parça durum notu en az 3 karakter olmalıdır.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/supplier/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: rfq.id,
          purchasePrice: numericPrice,
          shippingDays,
          conditionNote: conditionNote.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Teklif gönderilemedi. Lütfen tekrar deneyin.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      onSubmitted();
    } catch {
      setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Başlık */}
        <div className="bg-navy-900 px-6 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <h2 id="rfq-modal-title" className="text-base sm:text-lg font-bold">
                {rfq.myOffer
                  ? "Teklifi Güncelle"
                  : "Bende Var — Fiyat Gönder"}
              </h2>
              <p className="text-xs text-slate-300">
                Talep Kodu: <span className="font-mono font-semibold text-white">{rfq.code}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Modalı kapat"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kaydırılabilir İçerik */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-5 overflow-y-auto"
        >
          {/* Talep Özeti */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Parça Kodu
                </span>
                <span className="font-mono font-bold text-navy-900">
                  {rfq.partCode || "Belirtilmedi"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Marka & Kategori
                </span>
                <span className="font-semibold text-slate-800">
                  {rfq.brand || "Genel"} • {categoryLabel}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Şasi No (VIN)
                </span>
                <span className="font-mono text-xs sm:text-sm text-slate-800">
                  {rfq.vin || "Paylaşılmadı"}
                  {rfq.decodedVehicleJson?.brand
                    ? ` (${rfq.decodedVehicleJson.brand}${
                        rfq.decodedVehicleJson.modelYear
                          ? ` • ${rfq.decodedVehicleJson.modelYear}`
                          : ""
                      })`
                    : ""}
                </span>
              </div>
            </div>

            {rfq.note && (
              <div className="pt-2 border-t border-slate-200 flex items-start gap-2 text-xs text-slate-700">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-navy-900">Teknik Not: </span>
                  <span>{rfq.note}</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Fiyat Girişi */}
          <div className="space-y-1.5">
            <label
              htmlFor="purchasePrice"
              className="block text-sm font-semibold text-navy-900"
            >
              Alış / Tedarik Fiyatınız (₺)
            </label>
            <div className="relative">
              <input
                id="purchasePrice"
                type="number"
                min={1}
                step="1"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Örn: 8200"
                className="w-full rounded-xl border border-slate-300 bg-white pl-4 pr-12 py-2.5 text-base font-semibold text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                ₺
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Merkez test laboratuvarımız onayladıktan sonra bu tutar cari
              hesabınıza hakediş olarak işlenir.
            </p>
          </div>

          {/* Kargo Hazırlık Süresi */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-navy-900">
              Kargo Hazırlık Süresi
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {SHIPPING_OPTIONS.map((opt) => {
                const selected = shippingDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setShippingDays(opt.days)}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Truck
                        className={`w-4 h-4 ${
                          selected ? "text-orange-500" : "text-slate-400"
                        }`}
                      />
                      {selected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm font-bold text-navy-900">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parça Durum Notu */}
          <div className="space-y-1.5">
            <label
              htmlFor="conditionNote"
              className="block text-sm font-semibold text-navy-900"
            >
              Parça Durum Notu
            </label>
            <textarea
              id="conditionNote"
              rows={3}
              required
              minLength={3}
              value={conditionNote}
              onChange={(e) => setConditionNote(e.target.value)}
              placeholder="Orijinal çıkma, açılmamış etiketli, pinler sağlam"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {rfq.myOffer ? "Teklifi Güncelle" : "Teklifi İlet"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
