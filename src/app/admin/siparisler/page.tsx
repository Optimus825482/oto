"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  FileText,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { INQUIRY_STATUS_LABELS, formatTRY } from "@/types/domain";

interface AdminOrderRow {
  id: string;
  orderNo: string;
  customerPrice: number;
  purchasePrice: number;
  shippingCost: number;
  netProfit: number;
  paymentStatus: "PENDING" | "ESCROW_HELD" | "RELEASED" | "REFUNDED";
  invoiceNo: string | null;
  invoiceType: "INDIVIDUAL" | "CORPORATE";
  outboundCargoCode: string | null;
  outboundTrackingNo: string | null;
  status: string;
  createdAt: string;
  inquiry: {
    id: string;
    code: string;
    partCode: string | null;
    brand: string | null;
    customerName: string | null;
    customerPhone: string;
  };
  supplier: {
    id: string;
    companyName: string;
    city: string;
  };
  testLabRecord: {
    id: string;
    result: "PASS" | "FAIL";
    certificateCode: string | null;
  } | null;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ödeme Bekleniyor",
  ESCROW_HELD: "Güvence Hesabında (ESCROW_HELD)",
  RELEASED: "Serbest Bırakıldı",
  REFUNDED: "İade Edildi",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.inquiry.code.toLowerCase().includes(q) ||
        (o.inquiry.partCode ?? "").toLowerCase().includes(q) ||
        (o.inquiry.customerName ?? "").toLowerCase().includes(q) ||
        o.supplier.companyName.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  async function handleIssueInvoice(order: AdminOrderRow) {
    setBusyId(order.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/invoice`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "E-Fatura kesilemedi.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: `${order.orderNo} siparişi için E-Fatura kesildi: ${
          data.invoice?.invoiceNo ?? ""
        }`,
      });
      await loadOrders();
    } catch {
      setFeedback({
        type: "error",
        text: "E-Fatura servisi ile bağlantı kurulamadı.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleShipCustomer(order: AdminOrderRow) {
    setBusyId(order.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship-customer`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Müşteri kargo çıkışı yapılamadı.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: `${order.orderNo} için Tek Tip Kargo çıkışı yapıldı (${
          data.cargoLabel?.cargoCode ?? ""
        }) ve müşteriye SMS gönderildi.`,
      });
      await loadOrders();
    } catch {
      setFeedback({
        type: "error",
        text: "Kargo çıkışı sırasında bağlantı hatası oluştu.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-orange-500" />
            <span>Sipariş, Tek Tip Kargo &amp; E-Fatura</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Test Lab onaylı siparişlere resmî E-Fatura kesin ve OtoBeyinPazari
            antetli tek tip kutuyla müşteriye kargo çıkışı yapın.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 text-sm font-semibold shadow-xs cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-orange-500 ${loading ? "animate-spin" : ""}`}
          />
          <span>Yenile</span>
        </button>
      </div>

      {/* Search & Feedback */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sipariş no, talep kodu, parça kodu, müşteri veya tedarikçi ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Toplam {filteredOrders.length} sipariş listeleniyor
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-start gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden xl:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Sipariş &amp; Talep</th>
                <th className="py-3.5 px-4">Parça &amp; Müşteri</th>
                <th className="py-3.5 px-4">Tedarikçi</th>
                <th className="py-3.5 px-4">Fiyat &amp; Net Kâr</th>
                <th className="py-3.5 px-4">Ödeme / Durum</th>
                <th className="py-3.5 px-4">Test Sonucu</th>
                <th className="py-3.5 px-4">E-Fatura &amp; Kargo</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Siparişler yükleniyor...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const testPassed = order.testLabRecord?.result === "PASS";
                  const testFailed = order.testLabRecord?.result === "FAIL";
                  const certCode = order.testLabRecord?.certificateCode;
                  const canShip = testPassed && !order.outboundCargoCode;
                  const isBusy = busyId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-navy-900">
                          {order.orderNo}
                        </p>
                        <Link
                          href={`/takip/${order.inquiry.code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-orange-600 hover:underline mt-0.5"
                        >
                          <span>{order.inquiry.code}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {order.inquiry.brand || ""}{" "}
                          {order.inquiry.partCode || "-"}
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          {order.inquiry.customerName || "Müşteri"}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {order.inquiry.customerPhone}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-navy-900">
                          {order.supplier.companyName}
                        </p>
                        <p className="text-slate-500">{order.supplier.city}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-navy-900">
                          {formatTRY(order.customerPrice)}
                        </p>
                        <p className="text-emerald-700 font-semibold mt-0.5">
                          Net: {formatTRY(order.netProfit)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === "ESCROW_HELD"
                              ? "bg-amber-100 text-amber-800"
                              : order.paymentStatus === "RELEASED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {order.paymentStatus}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {INQUIRY_STATUS_LABELS[order.status] || order.status}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {testPassed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              TEST BAŞARILI
                            </span>
                            {certCode && (
                              <div>
                                <Link
                                  href={`/sertifika/${certCode}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>{certCode}</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        ) : testFailed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            ARIZALI
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            Test Bekliyor
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        {order.invoiceNo ? (
                          <p className="font-mono text-[11px] font-bold text-navy-900">
                            Fatura: {order.invoiceNo}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            E-Fatura kesilmedi
                          </p>
                        )}
                        {order.outboundCargoCode ? (
                          <p className="font-mono text-[11px] font-semibold text-emerald-700">
                            Kargo: {order.outboundCargoCode}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            Çıkış kargosu yok
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {!order.invoiceNo && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleIssueInvoice(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-orange-400" />
                              <span>E-Fatura Kes</span>
                            </button>
                          )}
                          {canShip && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleShipCustomer(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Tek Tip Kargo Çıkışı Yap</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="xl:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Siparişler yükleniyor...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Sipariş bulunamadı.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const testPassed = order.testLabRecord?.result === "PASS";
            const testFailed = order.testLabRecord?.result === "FAIL";
            const certCode = order.testLabRecord?.certificateCode;
            const canShip = testPassed && !order.outboundCargoCode;
            const isBusy = busyId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy-900">
                        {order.orderNo}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {order.inquiry.brand || ""}{" "}
                      {order.inquiry.partCode || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.inquiry.customerName || "Müşteri"} •{" "}
                      {order.supplier.companyName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-navy-900">
                      {formatTRY(order.customerPrice)}
                    </p>
                    <p className="text-xs font-bold text-emerald-600">
                      Net: {formatTRY(order.netProfit)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {testPassed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      TEST BAŞARILI
                    </span>
                  ) : testFailed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      ARIZALI
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                      Test Bekliyor
                    </span>
                  )}

                  {order.invoiceNo && (
                    <span className="font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-navy-900 font-semibold">
                      Fatura: {order.invoiceNo}
                    </span>
                  )}
                  {order.outboundCargoCode && (
                    <span className="font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold">
                      Kargo: {order.outboundCargoCode}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {!order.invoiceNo && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleIssueInvoice(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-orange-400" />
                      <span>E-Fatura Kes</span>
                    </button>
                  )}
                  {canShip && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleShipCustomer(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Tek Tip Kargo Çıkışı Yap</span>
                    </button>
                  )}
                  {certCode && (
                    <Link
                      href={`/sertifika/${certCode}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Sertifika</span>
                    </Link>
                  )}
                  <Link
                    href={`/takip/${order.inquiry.code}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-navy-900 text-xs font-bold"
                  >
                    <span>Takip Sayfası</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <p className="text-[11px] text-slate-400">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                    order.paymentStatus}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
