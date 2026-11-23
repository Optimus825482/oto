"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import { INQUIRY_STATUS_LABELS, formatTRY } from "@/types/domain";

interface AdminTestLabOrder {
  id: string;
  orderNo: string;
  customerPrice: number;
  purchasePrice: number;
  inboundCargoCode: string | null;
  inboundTrackingNo: string | null;
  status: string;
  createdAt: string;
  inquiry: {
    id: string;
    code: string;
    partCode: string | null;
    brand: string | null;
    category: string;
    customerName: string | null;
    customerPhone: string;
    vin: string | null;
  };
  supplier: {
    id: string;
    companyName: string;
    city: string;
    rating: number;
  };
  testLabRecord: {
    id: string;
    serialNo: string;
    hologramSealCode: string;
    physicalCheckOk: boolean;
    pinCheckOk: boolean;
    canObdCheckOk: boolean;
    result: "PASS" | "FAIL";
    notes: string | null;
    certificateCode: string | null;
    testedAt: string;
  } | null;
}

const ACTIVE_QUEUE_STATUSES = new Set([
  "PAID",
  "SUPPLIER_SHIPPED",
  "IN_TEST_LAB",
]);

const HISTORY_STATUSES = new Set([
  "TEST_PASSED",
  "TEST_FAILED",
  "SHIPPED_TO_CUSTOMER",
  "DELIVERED",
]);

export default function TestLabPage() {
  const [orders, setOrders] = useState<AdminTestLabOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // QC Form state
  const [serialNo, setSerialNo] = useState("");
  const [hologramSealCode, setHologramSealCode] = useState("");
  const [physicalCheckOk, setPhysicalCheckOk] = useState(false);
  const [pinCheckOk, setPinCheckOk] = useState(false);
  const [canObdCheckOk, setCanObdCheckOk] = useState(false);
  const [notes, setNotes] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    certificateCode?: string | null;
  } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: AdminTestLabOrder[] = data.orders ?? [];
        setOrders(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const activeQueueOrders = useMemo(
    () => orders.filter((o) => ACTIVE_QUEUE_STATUSES.has(o.status)),
    [orders]
  );

  const historyOrders = useMemo(
    () =>
      orders.filter(
        (o) => HISTORY_STATUSES.has(o.status) || o.testLabRecord !== null
      ),
    [orders]
  );

  const visibleOrders =
    activeTab === "ACTIVE" ? activeQueueOrders : historyOrders;

  useEffect(() => {
    if (
      visibleOrders.length > 0 &&
      !visibleOrders.some((o) => o.id === selectedOrderId)
    ) {
      setSelectedOrderId(visibleOrders[0].id);
    } else if (visibleOrders.length === 0) {
      setSelectedOrderId("");
    }
  }, [visibleOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    setFeedback(null);
    if (!selectedOrder) {
      setSerialNo("");
      setHologramSealCode("");
      setPhysicalCheckOk(false);
      setPinCheckOk(false);
      setCanObdCheckOk(false);
      setNotes("");
      return;
    }
    const rec = selectedOrder.testLabRecord;
    if (rec) {
      setSerialNo(rec.serialNo);
      setHologramSealCode(rec.hologramSealCode);
      setPhysicalCheckOk(rec.physicalCheckOk);
      setPinCheckOk(rec.pinCheckOk);
      setCanObdCheckOk(rec.canObdCheckOk);
      setNotes(rec.notes ?? "");
    } else {
      setSerialNo("");
      setHologramSealCode("");
      setPhysicalCheckOk(false);
      setPinCheckOk(false);
      setCanObdCheckOk(false);
      setNotes("");
    }
  }, [selectedOrder?.id]);

  function generateSealCode() {
    if (!selectedOrder) return;
    const suffix = selectedOrder.inquiry.code.replace(/[^A-Z0-9]/gi, "").slice(-4);
    const rand = Math.floor(100 + Math.random() * 900);
    setHologramSealCode(`OBP-SEAL-2026-${suffix}${rand}`);
  }

  async function handleSubmitTest(result: "PASS" | "FAIL") {
    if (!selectedOrder) return;
    setFeedback(null);

    if (!serialNo.trim() || !hologramSealCode.trim()) {
      setFeedback({
        type: "error",
        text: "Ürün Seri Numarası ve Güvenlik Hologram Mühür Kodu zorunludur.",
      });
      return;
    }

    if (
      result === "PASS" &&
      (!physicalCheckOk || !pinCheckOk || !canObdCheckOk)
    ) {
      setFeedback({
        type: "error",
        text: "Test Başarılı onayı verebilmek için 3 zorunlu tezgâh kontrolünün tamamını işaretlemelisiniz.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${selectedOrder.id}/test-lab`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serialNo: serialNo.trim(),
            hologramSealCode: hologramSealCode.trim(),
            physicalCheckOk,
            pinCheckOk,
            canObdCheckOk,
            result,
            notes: notes.trim() || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Test kaydı kaydedilemedi.",
        });
        return;
      }

      const certCode = data.testRecord?.certificateCode ?? null;
      setFeedback({
        type: "success",
        text:
          result === "PASS"
            ? `Test onaylandı! Sertifika (${certCode}) üretildi ve tedarikçi carisine hakediş işlendi.`
            : "Ürün arızalı olarak işaretlendi ve tedarikçi puanı güncellendi.",
        certificateCode: certCode,
      });

      await loadOrders();
    } catch {
      setFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-orange-500" />
            <span>Merkezi Test Laboratuvarı (QC Bench)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tedarikçiden merkeze ulaşan beyinleri tezgâh testinden geçirin,
            hologram mühürleyin ve QR Test Sertifikası üretin.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 text-sm font-semibold shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-orange-500 ${loading ? "animate-spin" : ""}`} />
          <span>Listeyi Yenile</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "ACTIVE"
              ? "bg-navy-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Aktif Test Kuyruğu ({activeQueueOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "HISTORY"
              ? "bg-navy-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Tamamlanan Testler ({historyOrders.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Queue */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-sm font-bold text-navy-900">
              {activeTab === "ACTIVE"
                ? "Test Bekleyen Cihazlar"
                : "Test Geçmişi (Başarılı / Başarısız)"}
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Siparişler yükleniyor...
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Bu sekmede görüntülenecek sipariş yok.
              </div>
            ) : (
              visibleOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const passed = order.testLabRecord?.result === "PASS";
                const failed = order.testLabRecord?.result === "FAIL";
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-orange-50/70 border-l-4 border-l-orange-500"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-navy-900">
                            {order.orderNo}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            ({order.inquiry.code})
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          {order.inquiry.brand || "Marka"}{" "}
                          {order.inquiry.partCode
                            ? `— ${order.inquiry.partCode}`
                            : ""}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tedarikçi: {order.supplier.companyName} (
                          {order.supplier.city})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            ONAYLI
                          </span>
                        ) : failed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            ARIZALI
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">
                            {INQUIRY_STATUS_LABELS[order.status] ||
                              order.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {order.inboundCargoCode && (
                      <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        Gelen Kargo: {order.inboundCargoCode}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Bench QC Form */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs min-h-[420px] flex flex-col items-center justify-center">
              <FlaskConical className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-base font-bold text-navy-900">
                Tezgâh Testi İçin Sipariş Seçin
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Sol listeden bir cihaz seçerek fiziksel kontrol, pin ölçümü ve
                CAN-Bus haberleşme testini kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Order Summary Header */}
              <div className="bg-navy-900 text-white px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-orange-300">
                      {selectedOrder.orderNo}
                    </span>
                    <span className="text-xs text-slate-300">
                      Talep: {selectedOrder.inquiry.code}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mt-2">
                    {selectedOrder.inquiry.brand || "Oto Beyin"}{" "}
                    {selectedOrder.inquiry.partCode || ""}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tedarikçi: {selectedOrder.supplier.companyName} • Alış:{" "}
                    {formatTRY(selectedOrder.purchasePrice)}
                  </p>
                </div>

                {selectedOrder.testLabRecord?.certificateCode && (
                  <Link
                    href={`/sertifika/${selectedOrder.testLabRecord.certificateCode}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      Sertifika: {selectedOrder.testLabRecord.certificateCode}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="p-5 space-y-5">
                {feedback && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium border space-y-2 ${
                      feedback.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                    {feedback.certificateCode && (
                      <div>
                        <Link
                          href={`/sertifika/${feedback.certificateCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>
                            QR Sertifikayı Görüntüle ({feedback.certificateCode})
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Serial & Seal Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-900 mb-1.5">
                      Ürün Seri Numarası (Serial No) *
                    </label>
                    <input
                      type="text"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      placeholder="Örn: SN-0281014236-8841"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-navy-900">
                        Güvenlik Hologram Mühür Kodu *
                      </label>
                      <button
                        type="button"
                        onClick={generateSealCode}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Kod Üret</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={hologramSealCode}
                      onChange={(e) => setHologramSealCode(e.target.value)}
                      placeholder="Örn: OBP-SEAL-2026-8841"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 3 Required Checklist Toggles */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Zorunlu Tezgâh Kalite Kontrol Adımları
                  </p>

                  {[
                    {
                      checked: physicalCheckOk,
                      toggle: () => setPhysicalCheckOk((v) => !v),
                      title: "Fiziksel / Su Hasarı / Lehim Kontrolü OK",
                      desc: "Kasa, PCB kartı, kondansatör ve daha önce işlem görmüş lehim noktaları incelendi.",
                    },
                    {
                      checked: pinCheckOk,
                      toggle: () => setPinCheckOk((v) => !v),
                      title: "Pin & Soket Kontrolü OK",
                      desc: "Soket pinlerinde eğilme, oksitlenme ve kısa devre olmadığı doğrulandı.",
                    },
                    {
                      checked: canObdCheckOk,
                      toggle: () => setCanObdCheckOk((v) => !v),
                      title: "CAN-Bus / OBD Tezgâh Haberleşme Testi OK",
                      desc: "Güç beslemesi altında EEPROM/Flash okuma ve CAN hattı yanıtı alındı.",
                    },
                  ].map((item) => (
                    <label
                      key={item.title}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        item.checked
                          ? "bg-emerald-50/70 border-emerald-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={item.toggle}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold text-navy-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Technician Notes */}
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1.5">
                    Teknisyen Notları
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ölçüm değerleri, yazılım versiyonu veya arıza detayı..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmitTest("PASS")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>✓ TEST BAŞARILI — Sertifika Üret &amp; Cariye İşle</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmitTest("FAIL")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>✕ TEST BAŞARISIZ — Arızalı İşaretle &amp; İade Et</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
