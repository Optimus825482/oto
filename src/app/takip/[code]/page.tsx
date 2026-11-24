"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CarFront,
  CheckCircle2,
  Cpu,
  CreditCard,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { OrderTimeline } from "@/components/storefront/OrderTimeline";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";
import {
  INQUIRY_STATUS_LABELS,
  PART_CATEGORIES,
  formatTRY,
} from "@/types/domain";

interface InquiryTrackingData {
  code: string;
  status: string;
  partCode: string | null;
  vin: string | null;
  brand: string | null;
  category: string;
  customerOfferPrice: number | null;
  paymentToken: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    orderNo: string;
    status: string;
    paymentStatus: string;
    outboundCargoCode: string | null;
    outboundTrackingNo: string | null;
    invoiceNo: string | null;
    returnDeadlineAt: string | null;
    certificateCode: string | null;
    testResult: "PASS" | "FAIL" | null;
    testedAt: string | null;
  } | null;
}

function getCategoryLabel(code: string): string {
  return PART_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export default function TrackingDetailPage() {
  const params = useParams<{ code: string }>();
  const rawCode = params?.code ? decodeURIComponent(params.code) : "";

  const [data, setData] = useState<InquiryTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTracking(targetCode: string) {
    if (!targetCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/inquiries?code=${encodeURIComponent(targetCode)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Takip kaydı bulunamadı.");
        setData(null);
        return;
      }
      setData(json.inquiry);
    } catch {
      setError("Takip bilgileri alınırken bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTracking(rawCode);
  }, [rawCode]);

  const statusLabel = data
    ? INQUIRY_STATUS_LABELS[data.status] ?? data.status
    : "";

  if (loading && !data) {
    return (
      <BrandLoadingScreen
        title={rawCode ? `Takip Kodu: ${rawCode}` : "Canlı Sipariş Takibi"}
        subtitle="Sipariş ve test laboratuvarı kayıtları getiriliyor..."
        badge="CANLI SİPARİŞ TAKİBİ"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Breadcrumb & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/takip"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy-900 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Başka Takip Kodu Sorgula</span>
          </Link>

          {rawCode && (
            <button
              type="button"
              onClick={() => fetchTracking(rawCode)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Durumu Yenile</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-14 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-medium">
              {rawCode} takip kaydı yükleniyor...
            </span>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-extrabold text-navy-900">
                Kayıt Bulunamadı ({rawCode})
              </h1>
              <p className="text-sm text-slate-600">
                {error || "Girdiğiniz takip koduna ait talep bulunamadı."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/takip"
                className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold"
              >
                Tekrar Ara
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold"
              >
                Yeni Talep Oluştur
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Header Card */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-lg sm:text-xl font-extrabold text-navy-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      {data.code}
                    </span>
                    {data.order?.orderNo && (
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Sipariş: {data.order.orderNo}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        data.status === "TEST_FAILED"
                          ? "bg-rose-100 text-rose-800"
                          : data.status === "DELIVERED" ||
                              data.status === "TEST_PASSED" ||
                              data.status === "SHIPPED_TO_CUSTOMER"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Oluşturma:{" "}
                    {new Date(data.createdAt).toLocaleString("tr-TR")} • Son
                    Güncelleme:{" "}
                    {new Date(data.updatedAt).toLocaleString("tr-TR")}
                  </p>
                </div>

                {/* Primary Contextual Action CTAs */}
                <div className="flex flex-wrap items-center gap-3">
                  {data.status === "OFFER_SENT" && data.paymentToken && (
                    <Link
                      href={`/teklif/${data.paymentToken}`}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-extrabold shadow-md transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Teklifi İncele &amp; Güvenli Ödeme Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {data.order?.certificateCode && (
                    <Link
                      href={`/sertifika/${data.order.certificateCode}`}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-md transition-colors"
                    >
                      <Award className="w-4 h-4" />
                      <span>QR Test &amp; Garanti Sertifikasını Görüntüle</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Part & VIN Details Grid (Zero supplier identity or purchase price) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-orange-500" />
                    <span>Parça / Beyin Kodu</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-extrabold text-navy-900">
                    {data.partCode || "Şaseden Tespit Ediliyor"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {getCategoryLabel(data.category)}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <CarFront className="w-3.5 h-3.5 text-navy-900" />
                    <span>Araç Marka &amp; Şase (VIN)</span>
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-navy-900">
                    {data.brand || "Belirleniyor"}
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5 truncate">
                    {data.vin || "VIN girilmedi"}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Müşteri Teklifi &amp; Güvence</span>
                  </div>
                  <div className="mt-1 text-base font-extrabold text-navy-900">
                    {data.customerOfferPrice != null
                      ? formatTRY(data.customerOfferPrice)
                      : "Fiyat Toplanıyor"}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mt-0.5">
                    {data.order?.paymentStatus === "ESCROW_HELD"
                      ? "Güvence Hesabında Korunuyor"
                      : data.order?.paymentStatus === "RELEASED"
                        ? "Ödeme Tamamlandı"
                        : "KDV & Test Dahil Tek Fiyat"}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <ReceiptText className="w-3.5 h-3.5 text-orange-500" />
                    <span>Resmi E-Fatura &amp; İade Hakkı</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-extrabold text-navy-900">
                    {data.order?.invoiceNo || "Test Sonrası Kesilecek"}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {data.order?.returnDeadlineAt
                      ? `14 Gün İade Son: ${new Date(
                          data.order.returnDeadlineAt
                        ).toLocaleDateString("tr-TR")}`
                      : "14 Gün Koşulsuz İade Garantisi"}
                  </div>
                </div>
              </div>
            </section>

            {/* 8-Step Visual Stepper */}
            <OrderTimeline status={data.status} />

            {/* Standardized Outbound Cargo Card (when shipped to customer) */}
            {data.order?.outboundCargoCode && (
              <section className="bg-white rounded-2xl border-2 border-emerald-400 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase">
                      <PackageCheck className="w-4 h-4" />
                      <span>Tek Tip Anti-Statik Merkez Kargo Sevki</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-navy-900">
                      Kargo Kodu:{" "}
                      <span className="font-mono text-orange-600">
                        {data.order.outboundCargoCode}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Takip Numarası:{" "}
                      <strong className="font-mono text-navy-900">
                        {data.order.outboundTrackingNo || "-"}
                      </strong>{" "}
                      • ESD korumalı kutu ve hologram mühürlü olarak gönderildi.
                    </p>
                  </div>
                </div>

                {data.order.certificateCode && (
                  <Link
                    href={`/sertifika/${data.order.certificateCode}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold shrink-0 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test Sertifikasını Aç</span>
                  </Link>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
