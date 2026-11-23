"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  User,
} from "lucide-react";
import { calculateCustomerPrice } from "@/lib/pricing";
import {
  INQUIRY_STATUS_LABELS,
  PART_CATEGORIES,
  formatTRY,
} from "@/types/domain";

export interface AdminSupplierOffer {
  id: string;
  inquiryId: string;
  supplierId: string;
  purchasePrice: number;
  shippingDays: number;
  conditionNote: string;
  photoUrl: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  supplier: {
    id: string;
    companyName: string;
    city: string;
    rating: number;
    totalDelivered: number;
    defectCount: number;
  };
}

export interface AdminInquiry {
  id: string;
  code: string;
  customerName: string | null;
  customerPhone: string;
  customerEmail: string | null;
  partCode: string | null;
  normalizedPartCode: string | null;
  vin: string | null;
  decodedVehicleJson: Record<string, unknown> | null;
  category: string;
  brand: string | null;
  photoUrl: string | null;
  note: string | null;
  status: string;
  selectedOfferId: string | null;
  customerOfferPrice: number | null;
  marginPercent: number | null;
  paymentToken: string | null;
  broadcastedAt: string | null;
  createdAt: string;
  offers: AdminSupplierOffer[];
  order?: {
    id: string;
    orderNo: string;
    status: string;
  } | null;
}

interface RfqComparePanelProps {
  inquiry: AdminInquiry | null;
  onUpdated: () => Promise<void> | void;
}

const CATEGORY_MAP = new Map(PART_CATEGORIES.map((c) => [c.code, c.label]));

export default function RfqComparePanel({
  inquiry,
  onUpdated,
}: RfqComparePanelProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [marginPercent, setMarginPercent] = useState<number>(22);
  const [broadcasting, setBroadcasting] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [originUrl, setOriginUrl] = useState<string>("https://otobeyinpazari.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setFeedback(null);
    setCopiedLink(false);
    if (!inquiry) {
      setSelectedOfferId("");
      setMarginPercent(22);
      return;
    }

    const preselected =
      inquiry.selectedOfferId &&
      inquiry.offers.some((o) => o.id === inquiry.selectedOfferId)
        ? inquiry.selectedOfferId
        : inquiry.offers[0]?.id ?? "";

    setSelectedOfferId(preselected);

    if (
      typeof inquiry.marginPercent === "number" &&
      inquiry.marginPercent >= 10 &&
      inquiry.marginPercent <= 45
    ) {
      setMarginPercent(inquiry.marginPercent);
    } else {
      setMarginPercent(22);
    }
  }, [inquiry?.id, inquiry?.selectedOfferId, inquiry?.offers.length]);

  const selectedOffer = useMemo(() => {
    if (!inquiry) return null;
    return inquiry.offers.find((o) => o.id === selectedOfferId) ?? null;
  }, [inquiry, selectedOfferId]);

  const pricing = useMemo(() => {
    if (!selectedOffer) return null;
    return calculateCustomerPrice(selectedOffer.purchasePrice, marginPercent, 350);
  }, [selectedOffer, marginPercent]);

  const paymentPath = inquiry?.paymentToken
    ? `/teklif/${inquiry.paymentToken}`
    : null;
  const fullPaymentUrl = paymentPath
    ? `${originUrl}${paymentPath}`
    : `${originUrl}/teklif/<otomatik-link>`;

  const smsPreviewText = useMemo(() => {
    if (!inquiry || !pricing) return "";
    const partLabel = inquiry.partCode || inquiry.code;
    return `Sayın Müşterimiz, aradığınız ${partLabel} tedarik ağımızda bulunmuştur. Test Onaylı & Faturalı Fiyat: ${formatTRY(
      pricing.customerPrice
    )} (KDV & Tek Tip Kargo Dahil, 14 Gün İade Güvenceli). Güvenli Ödeme Linki: ${fullPaymentUrl}`;
  }, [inquiry, pricing, fullPaymentUrl]);

  async function handleBroadcast() {
    if (!inquiry) return;
    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}/broadcast`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Toplu RFQ yayını sırasında hata oluştu.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: `${data.notifiedSupplierCount ?? 0} onaylı tedarikçiye toplu RFQ mesajı gönderildi.`,
      });
      await onUpdated();
    } catch {
      setFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleSelectOffer() {
    if (!inquiry || !selectedOffer) return;
    setSendingOffer(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/inquiries/${inquiry.id}/select-offer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: selectedOffer.id,
            marginPercent,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Teklif onaylanırken hata oluştu.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: `Teklif onaylandı ve müşteriye SMS teklif linki gönderildi (${formatTRY(
          data.pricing?.customerPrice ?? pricing?.customerPrice ?? 0
        )}).`,
      });
      await onUpdated();
    } catch {
      setFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setSendingOffer(false);
    }
  }

  async function handleCopyLink() {
    if (!paymentPath) return;
    try {
      await navigator.clipboard.writeText(`${originUrl}${paymentPath}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  }

  if (!inquiry) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs h-full flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-navy-900">
          Talep Seçilmedi
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Sol listeden bir müşteri talebi seçerek tedarikçilere toplu RFQ
          yayınlayabilir veya gelen teklifleri kâr marjı ile karşılaştırabilirsiniz.
        </p>
      </div>
    );
  }

  const decodedSummary = inquiry.decodedVehicleJson
    ? [
        inquiry.decodedVehicleJson.brand,
        inquiry.decodedVehicleJson.model,
        inquiry.decodedVehicleJson.year,
        inquiry.decodedVehicleJson.engine,
      ]
        .filter(Boolean)
        .join(" • ")
    : null;

  const isLockedToOrder = Boolean(inquiry.order);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-navy-900 text-white px-5 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-orange-300 border border-white/10">
              {inquiry.code}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30">
              {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}
            </span>
          </div>
          <h2 className="text-lg font-bold mt-2">
            {inquiry.brand || "Araç Markası Belirtilmedi"}{" "}
            {inquiry.partCode ? `— ${inquiry.partCode}` : ""}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {CATEGORY_MAP.get(inquiry.category as never) || inquiry.category}
            {decodedSummary ? ` • ${decodedSummary}` : ""}
          </p>
        </div>

        <div className="text-right text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-end gap-1.5 font-semibold text-white">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>{inquiry.customerName || "Müşteri"}</span>
          </div>
          <p className="font-mono">{inquiry.customerPhone}</p>
          {inquiry.vin && (
            <p className="font-mono text-[11px] text-slate-400">
              Şasi (VIN): {inquiry.vin}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Customer Note */}
        {inquiry.note && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700">
            <span className="font-semibold text-navy-900">Müşteri Notu: </span>
            {inquiry.note}
          </div>
        )}

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-start gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Broadcast CTA for NEW inquiries */}
        {inquiry.status === "NEW" && (
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-navy-900">
                Talep Henüz Tedarik Ağına Yayınlanmadı
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Onaylı tedarikçilere marka eşleşmeli anlık WhatsApp &amp; Panel
                RFQ bildirimi gönderin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {broadcasting
                  ? "Gönderiliyor..."
                  : "Tedarikçilere Toplu Mesaj Gönder (RFQ)"}
              </span>
            </button>
          </div>
        )}

        {/* Payment Link Banner when paymentToken exists */}
        {paymentPath && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Müşteri Güvence Ödeme Linki Hazır
              </p>
              <p className="font-mono text-xs sm:text-sm text-navy-900 font-semibold truncate mt-0.5">
                {paymentPath}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
              <a
                href={paymentPath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <span>Aç</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Incoming Offers Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-navy-900">
              Gelen Tedarikçi Teklifleri ({inquiry.offers.length})
            </h3>
            {inquiry.offers.length > 0 && (
              <span className="text-xs text-slate-500">
                Karşılaştırmak ve fiyatlamak için bir teklif seçin
              </span>
            )}
          </div>

          {inquiry.offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Henüz tedarikçi teklifi gelmedi
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {inquiry.status === "NEW"
                  ? "Önce yukarıdaki butonla talebi tedarikçilere yayınlayın."
                  : "Tedarikçiler panel üzerinden fiyat verdikçe teklifler burada yan yana listelenecektir."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {inquiry.offers.map((offer) => {
                const isSelected = offer.id === selectedOfferId;
                const isAccepted = offer.status === "ACCEPTED";
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedOfferId(offer.id)}
                    className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-white hover:border-navy-700/40 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-900 truncate">
                          {offer.supplier.companyName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {offer.supplier.city}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            {offer.supplier.rating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({offer.supplier.totalDelivered} teslimat)
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-navy-900">
                          {formatTRY(offer.purchasePrice)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Clock className="w-3 h-3" />
                          {offer.shippingDays} iş günü
                        </span>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-700 bg-slate-100/80 rounded-lg px-2.5 py-1.5">
                      {offer.conditionNote}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-700"
                            : offer.status === "REJECTED"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isAccepted
                          ? "Onaylanan Teklif"
                          : offer.status === "REJECTED"
                            ? "Diğer Teklif"
                            : "Beklemede"}
                      </span>
                      {isSelected && (
                        <span className="font-bold text-orange-600">
                          ✓ Seçili
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Margin Slider & Pricing Simulator */}
        {selectedOffer && pricing && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-navy-900">
                  Kâr / Hizmet Marjı &amp; Müşteri Fiyat Hesaplayıcı
                </h4>
                <p className="text-xs text-slate-500">
                  Satış fiyatı otomatik olarak en yakın 50 ₺ katına yuvarlanır.
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-navy-900 text-white text-sm font-bold">
                %{marginPercent} Marj
              </span>
            </div>

            <div>
              <input
                type="range"
                min={10}
                max={45}
                step={1}
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value))}
                disabled={isLockedToOrder}
                className="w-full accent-orange-500 cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>%10 (Rekabetçi)</span>
                <span>%22 (Standart)</span>
                <span>%35</span>
                <span>%45</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500 font-medium">
                  Tedarikçi Alış
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {formatTRY(pricing.purchasePrice)}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Kargo &amp; Test Payı
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {formatTRY(pricing.shippingCost)}
                </p>
              </div>
              <div className="rounded-xl bg-navy-900 text-white p-3">
                <p className="text-[11px] text-orange-300 font-medium">
                  Müşteri Satış Fiyatı
                </p>
                <p className="text-base font-extrabold mt-0.5">
                  {formatTRY(pricing.customerPrice)}
                </p>
              </div>
              <div
                className={`rounded-xl border p-3 ${
                  pricing.netProfit > 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                <p
                  className={`text-[11px] font-medium ${
                    pricing.netProfit > 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  Net Kâr
                </p>
                <p
                  className={`text-base font-extrabold mt-0.5 ${
                    pricing.netProfit > 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {formatTRY(pricing.netProfit)}
                </p>
              </div>
            </div>

            {/* Live SMS / WhatsApp Preview */}
            <div className="rounded-xl bg-white border border-slate-200 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 mb-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-orange-500" />
                <span>SMS / WhatsApp Teklif Önizlemesi</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                {smsPreviewText}
              </p>
            </div>

            {/* Confirm & Send CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Onay sonrası{" "}
                  <strong className="text-navy-900">
                    {selectedOffer.supplier.companyName}
                  </strong>{" "}
                  seçilir ve müşteriye ödeme linki iletilir.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectOffer}
                disabled={sendingOffer || isLockedToOrder}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-orange-400" />
                <span>
                  {isLockedToOrder
                    ? "Siparişe Dönüşmüş"
                    : sendingOffer
                      ? "SMS Gönderiliyor..."
                      : "Seçili Tedarikçiyi Onayla & Müşteriye SMS Gönder"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
