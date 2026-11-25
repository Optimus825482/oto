"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Star,
  Wallet,
} from "lucide-react";
import { formatTRY } from "@/types/domain";

interface SupplierLedgerProfile {
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

interface SupplierLedgerEntryItem {
  id: string;
  orderId: string | null;
  type: "CREDIT_EARNED" | "PAYOUT_PAID" | "DEDUCTION_DEFECT";
  amount: number;
  description: string;
  status: "PENDING" | "SETTLED";
  createdAt: string;
}

const ENTRY_TYPE_LABELS: Record<SupplierLedgerEntryItem["type"], string> = {
  CREDIT_EARNED: "Hakediş Kazancı",
  PAYOUT_PAID: "Hakediş Ödemesi",
  DEDUCTION_DEFECT: "Arızalı İade Kesintisi",
};

function formatDateTR(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function TedarikciCariPage() {
  const [profile, setProfile] = useState<SupplierLedgerProfile | null>(null);
  const [entries, setEntries] = useState<SupplierLedgerEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/supplier/ledger", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Cari hesap bilgileri yüklenemedi.");
      }
      setProfile(data?.profile ?? null);
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cari hesap verileri alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLedger(false);
  }, [loadLedger]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Cari Hesap & Hakediş
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {profile
              ? `${profile.companyName} — Test onaylı teslimat hakedişleri ve ödeme hareketleri.`
              : "Test onaylı teslimat hakedişlerinizi ve ödeme geçmişinizi takip edin."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLedger(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-navy-900 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`}
          />
          <span>Yenile</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
          <p className="text-sm text-slate-600">
            Cari hesap hareketleri yükleniyor...
          </p>
        </div>
      ) : (
        <>
          {/* Özet Kartları */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-navy-900 text-white border border-navy-800 p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Ödenecek Cari Bakiye
                </span>
                <Wallet className="w-4 h-4 text-orange-400" />
              </div>
              <p className="mt-2.5 text-2xl font-bold">
                {profile ? formatTRY(profile.balance) : "0 ₺"}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                Onaylı hakediş toplamı
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Tedarikçi Kalite Puanı
                </span>
                <Star className="w-4 h-4 text-orange-500 fill-orange-400" />
              </div>
              <p className="mt-2.5 text-2xl font-bold text-navy-900">
                {profile ? `★ ${profile.rating.toFixed(1)}` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                5.0 üzerinden performans
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Testten Geçen Teslimat
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="mt-2.5 text-2xl font-bold text-emerald-700">
                {profile ? profile.totalDelivered : 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tezgâh onaylı parça adedi
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Arızalı İade Sayısı
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="mt-2.5 text-2xl font-bold text-rose-600">
                {profile ? profile.defectCount : 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Test lab reddedilen parça
              </p>
            </div>
          </section>

          {/* Uzmanlık Markaları */}
          {profile && (
            <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-navy-900">
                    Uzmanlık Markaları
                  </h2>
                  <p className="text-xs text-slate-500">
                    Öncelikli RFQ bildirimi aldığınız araç markaları
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {profile.specialtyBrands.length > 0 ? (
                  profile.specialtyBrands.map((brand) => (
                    <span
                      key={brand}
                      className="inline-flex items-center rounded-full bg-navy-900/5 border border-navy-900/15 px-3 py-1 text-xs font-semibold text-navy-900"
                    >
                      {brand}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">
                    Tüm markalar aktif
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Cari Hareketler Tablosu */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-navy-900">
                Cari Hesap Hareketleri
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Toplam {entries.length} kayıt
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Henüz cari hesap hareketi bulunmuyor. Test laboratuvarı onayı
                sonrası hakedişleriniz burada listelenecektir.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 sm:px-5">Tarih</th>
                      <th className="py-3 px-4 sm:px-5">Açıklama</th>
                      <th className="py-3 px-4 sm:px-5">İşlem Tipi</th>
                      <th className="py-3 px-4 sm:px-5 text-right">Tutar</th>
                      <th className="py-3 px-4 sm:px-5 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {entries.map((entry) => {
                      const isPositive = entry.amount >= 0;
                      const formattedAmount = `${
                        isPositive ? "+" : "-"
                      }${formatTRY(Math.abs(entry.amount))}`;

                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                            {formatDateTR(entry.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 font-medium text-navy-900">
                            {entry.description}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {ENTRY_TYPE_LABELS[entry.type] || entry.type}
                            </span>
                          </td>
                          <td
                            className={`py-3.5 px-4 sm:px-5 whitespace-nowrap text-right font-bold ${
                              entry.type === "DEDUCTION_DEFECT"
                                ? "text-rose-600"
                                : isPositive
                                ? "text-emerald-600"
                                : "text-navy-900"
                            }`}
                          >
                            {formattedAmount}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                entry.status === "SETTLED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-orange-50 text-orange-700 border border-orange-200"
                              }`}
                            >
                              {entry.status === "SETTLED"
                                ? "Ödendi"
                                : "Bekliyor"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
