"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Loader2,
  MapPin,
  PackageCheck,
  Printer,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import {
  formatTRY,
  INQUIRY_STATUS_LABELS,
  PART_CATEGORIES,
} from "@/types/domain";

interface SupplierOrderItem {
  id: string;
  orderNo: string;
  purchasePrice: number;
  status: string;
  inboundCargoCode: string | null;
  inboundTrackingNo: string | null;
  createdAt: string;
  inquiry: {
    code: string;
    partCode: string | null;
    brand: string | null;
    category: string;
    vin: string | null;
  } | null;
  testLabRecord: {
    result: "PASS" | "FAIL";
    testedAt: string;
    notes: string | null;
  } | null;
}

function formatDateTR(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function TedarikciSiparislerPage() {
  const [orders, setOrders] = useState<SupplierOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/supplier/orders", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Siparişler yüklenemedi.");
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Siparişler alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  useEffect(() => {
    function handleAfterPrint() {
      setPrintingOrderId(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  async function handleShipToHub(orderId: string) {
    setShippingId(orderId);
    setError(null);

    try {
      const res = await fetch(`/api/supplier/orders/${orderId}/ship`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Kargo kodu üretilirken bir hata oluştu."
        );
      }

      if (data?.order) {
        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status: data.order.status,
                  inboundCargoCode: data.order.inboundCargoCode,
                  inboundTrackingNo: data.order.inboundTrackingNo,
                }
              : item
          )
        );
      } else {
        await loadOrders(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sevk işlemi sırasında hata oluştu."
      );
    } finally {
      setShippingId(null);
    }
  }

  function handlePrintLabel(orderId: string) {
    setPrintingOrderId(orderId);
    setTimeout(() => {
      window.print();
    }, 60);
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Siparişler & Kargo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Onaylanan ve ödemesi güvence hesabına alınan siparişlerinizi
            merkez test laboratuvarımıza sevk edin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(true)}
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
          className="no-print flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
          <p className="text-sm text-slate-600">Siparişler yükleniyor...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-2">
          <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-navy-900">
            Henüz onaylanmış siparişiniz bulunmuyor
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Gelen taleplere verdiğiniz teklifler seçilip müşteri ödemesi
            alındığında siparişler burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const categoryLabel = order.inquiry
              ? PART_CATEGORIES.find((c) => c.code === order.inquiry?.category)
                  ?.label || order.inquiry.category
              : "Elektronik Modül";
            const statusLabel =
              INQUIRY_STATUS_LABELS[order.status] || order.status;
            const isHiddenForPrint =
              printingOrderId !== null && printingOrderId !== order.id;

            return (
              <article
                key={order.id}
                className={`rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 ${
                  isHiddenForPrint ? "print:hidden" : ""
                }`}
              >
                {/* Sipariş Üst Bilgileri */}
                <div className="no-print flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-mono font-bold text-white">
                        {order.orderNo}
                      </span>
                      {order.inquiry?.code && (
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700">
                          Talep: {order.inquiry.code}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {formatDateTR(order.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2 pt-1">
                      <Cpu className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="font-mono">
                        {order.inquiry?.partCode || "Parça Kodu Belirtilmedi"}
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {order.inquiry?.brand || "Genel"} • {categoryLabel}
                      {order.inquiry?.vin ? ` • VIN: ${order.inquiry.vin}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Tedarik Hakediş Tutarı
                      </span>
                      <span className="text-xl font-bold text-navy-900">
                        {formatTRY(order.purchasePrice)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                          order.status === "PAID"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : order.status === "TEST_FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {statusLabel}
                      </span>

                      {order.testLabRecord && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                            order.testLabRecord.result === "PASS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {order.testLabRecord.result === "PASS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Test Lab:{" "}
                            {order.testLabRecord.result === "PASS"
                              ? "PASS (Onaylı)"
                              : "FAIL (Başarısız)"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Laboratuvarı Notu */}
                {order.testLabRecord?.notes && (
                  <div
                    className={`no-print rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-start gap-2.5 ${
                      order.testLabRecord.result === "PASS"
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : "bg-rose-50/70 border-rose-200 text-rose-900"
                    }`}
                  >
                    <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        Test Laboratuvarı Raporu:{" "}
                      </span>
                      <span>{order.testLabRecord.notes}</span>
                    </div>
                  </div>
                )}

                {/* Sevk Butonu (status === PAID) */}
                {order.status === "PAID" && !order.inboundCargoCode && (
                  <div className="no-print pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-slate-600">
                      Güvence ödemesi alındı. Parçayı antistatik korumalı paket
                      ile merkez test laboratuvarımıza göndermek için kargo kodu
                      oluşturun.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleShipToHub(order.id)}
                      disabled={shippingId === order.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {shippingId === order.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Kargo Kodu Üretiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Merkeze Kargo Kodu Üret & Sevk Et</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Yazdırılabilir Sevk Etiketi */}
                {order.inboundCargoCode && (
                  <div className="rounded-xl border-2 border-dashed border-navy-900/30 bg-slate-50 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
                          <Barcode className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-navy-900">
                            OtoBeyinPazari Test Merkezi Sevk Etiketi
                          </h3>
                          <p className="text-xs text-slate-500">
                            Sipariş No: {order.orderNo} • Parça:{" "}
                            {order.inquiry?.partCode || "—"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrintLabel(order.id)}
                        className="no-print self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-orange-400" />
                        <span>Yazdır</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Anlaşmalı Kargo Kampanya / Sevk Kodu
                        </span>
                        <span className="mt-1 block text-lg font-mono font-bold text-navy-900">
                          {order.inboundCargoCode}
                        </span>
                      </div>

                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Takip Numarası
                        </span>
                        <span className="mt-1 block text-lg font-mono font-bold text-orange-600">
                          {order.inboundTrackingNo || "Oluşturuldu"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border border-slate-200 p-3 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Teslimat Merkezi Adresi
                        </span>
                        <span className="font-semibold text-navy-900">
                          OtoBeyinPazari Merkez Test Laboratuvarı — İkitelli OSB
                          / İstanbul
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
