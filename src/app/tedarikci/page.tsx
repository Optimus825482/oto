"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Inbox,
  Loader2,
  PackageCheck,
  RefreshCw,
  Shield,
  Star,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import RfqOfferModal, {
  type SupplierRfqItem,
} from "@/components/supplier/RfqOfferModal";
import {
  formatTRY,
  INQUIRY_STATUS_LABELS,
  PART_CATEGORIES,
} from "@/types/domain";

interface SupplierProfileSummary {
  companyName: string;
  city: string;
  district: string | null;
  rating: number;
  totalDelivered: number;
  defectCount: number;
  balance: number;
  specialtyBrands: string[];
  isApproved: boolean;
}

function formatTimeAgo(isoDate: string | null): string {
  if (!isoDate) return "Az önce";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return "Az önce";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

function shippingDaysLabel(days: number): string {
  if (days === 1) return "Bugün Kargo";
  if (days === 2) return "Yarın Kargo";
  return `${days} Gün İçinde Kargo`;
}

export default function TedarikciRfqPage() {
  const [rfqs, setRfqs] = useState<SupplierRfqItem[]>([]);
  const [profile, setProfile] = useState<SupplierProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRfq, setActiveRfq] = useState<SupplierRfqItem | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [rfqRes, ledgerRes] = await Promise.all([
        fetch("/api/supplier/rfqs", { cache: "no-store" }),
        fetch("/api/supplier/ledger", { cache: "no-store" }),
      ]);

      const rfqData = await rfqRes.json().catch(() => ({}));
      const ledgerData = await ledgerRes.json().catch(() => ({}));

      if (!rfqRes.ok) {
        throw new Error(rfqData?.error || "Talepler yüklenemedi.");
      }

      setRfqs(Array.isArray(rfqData?.rfqs) ? rfqData.rfqs : []);
      if (ledgerRes.ok && ledgerData?.profile) {
        setProfile(ledgerData.profile);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Veriler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Gelen Talepler (RFQ)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {profile
              ? `${profile.companyName} (${profile.city}${
                  profile.district ? ` / ${profile.district}` : ""
                }) — Elinizdeki parçalar için anında alış fiyatı iletin.`
              : "Merkez operasyonun yayınladığı aktif parça taleplerini inceleyin ve fiyat verin."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-navy-900 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`}
          />
          <span>Talepleri Yenile</span>
        </button>
      </div>

      {/* Üst KPI Şeridi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Aktif Talepler
            </span>
            <Inbox className="w-4 h-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900">
            {loading ? "—" : rfqs.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fiyat bekleyen yayın
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Toplam Teslimat
            </span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900">
            {profile ? `${profile.totalDelivered}` : "—"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Test onaylı parça
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Tedarikçi Puanı
            </span>
            <Star className="w-4 h-4 text-orange-500 fill-orange-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900">
            {profile ? `★ ${profile.rating.toFixed(1)}` : "—"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            5.0 üzerinden kalite skoru
          </p>
        </div>

        <div className="rounded-2xl bg-navy-900 text-white border border-navy-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Güncel Cari Bakiye
            </span>
            <Wallet className="w-4 h-4 text-orange-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {profile ? formatTRY(profile.balance) : "—"}
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Ödenecek hakediş bakiyesi
          </p>
        </div>
      </section>

      {/* Kapalı Ağ Bilgilendirme Şeridi */}
      <div className="rounded-xl bg-navy-900/5 border border-navy-900/10 px-4 py-3 flex items-center gap-3 text-xs sm:text-sm text-navy-900">
        <Shield className="w-4 h-4 text-orange-500 shrink-0" />
        <span>
          <strong>Kapalı Ağ Gizliliği:</strong> Tüm talepler anonimleştirilmiş
          teknik verilerle yayınlanır; teklifiniz onaylandığında parça Merkez
          Test Laboratuvarımıza sevk edilir.
        </span>
      </div>

      {/* Hata Durumu */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="font-semibold underline cursor-pointer"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Yükleniyor */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
          <p className="text-sm text-slate-600">
            Açık RFQ talepleri yükleniyor...
          </p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-2">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-navy-900">
            Şu anda aktif talep bulunmuyor
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Merkez operasyon yeni bir parça talebi yayınladığında burada
            listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rfqs.map((rfq) => {
            const categoryLabel =
              PART_CATEGORIES.find((c) => c.code === rfq.category)?.label ||
              rfq.category;
            const statusLabel =
              INQUIRY_STATUS_LABELS[rfq.status] || rfq.status;
            const timeAgo = formatTimeAgo(rfq.broadcastedAt || rfq.createdAt);

            return (
              <article
                key={rfq.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  {/* Kart Üst Satır */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-mono font-bold text-white">
                        {rfq.code}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        rfq.status === "BROADCASTED"
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-navy-900/10 text-navy-900 border border-navy-900/15"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Parça Kodu & Marka */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wide">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        {rfq.brand || "Marka Belirtilmedi"} • {categoryLabel}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold font-mono text-navy-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{rfq.partCode || "Parça Kodu Bekleniyor"}</span>
                    </h2>
                  </div>

                  {/* VIN & Araç Bilgisi */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">
                        Şasi No (VIN):
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {rfq.vin || "Belirtilmedi"}
                      </span>
                    </div>
                    {rfq.decodedVehicleJson?.brand && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">
                          Araç Bilgisi:
                        </span>
                        <span className="font-semibold text-navy-900">
                          {rfq.decodedVehicleJson.brand}
                          {rfq.decodedVehicleJson.modelYear
                            ? ` (${rfq.decodedVehicleJson.modelYear})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Müşteri Teknik Notu */}
                  {rfq.note && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-amber-50/50 border border-amber-200/60 rounded-xl px-3.5 py-2.5">
                      <span className="font-semibold text-navy-900">Not: </span>
                      {rfq.note}
                    </p>
                  )}
                </div>

                {/* Kart Alt Aksiyon */}
                <div className="pt-3 border-t border-slate-100">
                  {rfq.myOffer ? (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveRfq(rfq)}
                        className="w-full inline-flex items-center justify-between gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Teklifiniz İletildi:{" "}
                            {formatTRY(rfq.myOffer.purchasePrice)}
                          </span>
                        </span>
                        <span className="text-xs font-bold underline">
                          (Güncelle)
                        </span>
                      </button>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
                        <span className="inline-flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {shippingDaysLabel(rfq.myOffer.shippingDays)}
                        </span>
                        <span className="truncate max-w-[240px]">
                          {rfq.myOffer.conditionNote}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveRfq(rfq)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Bende Var — Fiyat Ver</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Teklif Verme / Güncelleme Modalı */}
      <RfqOfferModal
        rfq={activeRfq}
        onClose={() => setActiveRfq(null)}
        onSubmitted={() => {
          setActiveRfq(null);
          loadData(true);
        }}
      />
    </div>
  );
}
