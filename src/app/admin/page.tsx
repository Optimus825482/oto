"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  Clock,
  FlaskConical,
  Inbox,
  MessageSquare,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import RfqComparePanel, {
  AdminInquiry,
} from "@/components/admin/RfqComparePanel";
import { INQUIRY_STATUS_LABELS, formatTRY } from "@/types/domain";

interface DashboardKpis {
  totalInquiries: number;
  newInquiries: number;
  awaitingQuotes: number;
  activeOrders: number;
  inTestLab: number;
  passedTests: number;
  totalRevenue: number;
  totalNetProfit: number;
}

interface NotificationLogItem {
  id: string;
  channel: "SMS" | "WHATSAPP" | "PANEL";
  recipient: string;
  template: string;
  message: string;
  status: string;
  createdAt: string;
}

type FilterTab = "ALL" | "NEW" | "QUOTES" | "OFFER_SENT" | "ORDER";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Tümü" },
  { key: "NEW", label: "Yeni" },
  { key: "QUOTES", label: "Teklif Gelen" },
  { key: "OFFER_SENT", label: "Teklif Gönderilen" },
  { key: "ORDER", label: "Sipariş" },
];

const ORDER_STATUSES = new Set([
  "PAID",
  "SUPPLIER_SHIPPED",
  "IN_TEST_LAB",
  "TEST_PASSED",
  "TEST_FAILED",
  "SHIPPED_TO_CUSTOMER",
  "DELIVERED",
  "RETURN_REQUESTED",
]);

function getStatusPillClass(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "BROADCASTED":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "QUOTES_RECEIVED":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "OFFER_SENT":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "TEST_FAILED":
    case "RETURN_REQUESTED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "TEST_PASSED":
    case "SHIPPED_TO_CUSTOMER":
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [notifications, setNotifications] = useState<NotificationLogItem[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forbiddenInquiries, setForbiddenInquiries] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMsg(null);
    try {
      const [dashRes, inqRes] = await Promise.all([
        fetch("/api/admin/dashboard", { cache: "no-store" }),
        fetch("/api/admin/inquiries", { cache: "no-store" }),
      ]);

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setKpis(dashData.kpis ?? null);
        setNotifications(dashData.recentNotifications ?? []);
      }

      if (inqRes.status === 403) {
        setForbiddenInquiries(true);
        setInquiries([]);
      } else if (inqRes.ok) {
        setForbiddenInquiries(false);
        const inqData = await inqRes.json();
        const list: AdminInquiry[] = inqData.inquiries ?? [];
        setInquiries(list);
        setSelectedInquiryId((prev) => {
          if (prev && list.some((item) => item.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      } else {
        const err = await inqRes.json().catch(() => ({}));
        setErrorMsg(err.error || "Talepler yüklenemedi.");
      }
    } catch {
      setErrorMsg("Operasyon verileri alınırken bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (activeTab === "NEW" && item.status !== "NEW") return false;
      if (
        activeTab === "QUOTES" &&
        item.status !== "BROADCASTED" &&
        item.status !== "QUOTES_RECEIVED"
      ) {
        return false;
      }
      if (activeTab === "OFFER_SENT" && item.status !== "OFFER_SENT") {
        return false;
      }
      if (activeTab === "ORDER" && !ORDER_STATUSES.has(item.status)) {
        return false;
      }

      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        (item.partCode ?? "").toLowerCase().includes(q) ||
        (item.brand ?? "").toLowerCase().includes(q) ||
        (item.customerName ?? "").toLowerCase().includes(q) ||
        item.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [inquiries, activeTab, searchQuery]);

  const selectedInquiry = useMemo(() => {
    return inquiries.find((i) => i.id === selectedInquiryId) ?? null;
  }, [inquiries, selectedInquiryId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">
            Operasyon &amp; Toplu RFQ Merkezi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Müşteri taleplerini tedarik ağına yayınlayın, gelen teklifleri
            marjlayıp tek tıkla SMS teklifi gönderin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-orange-500 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          <span>Yenile</span>
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Talep
            </p>
            <div className="w-8 h-8 rounded-xl bg-navy-900/5 text-navy-900 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">
            {kpis ? kpis.totalInquiries : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Aktif sipariş: {kpis?.activeOrders ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Yeni / Bekleyen
            </p>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 mt-2">
            {kpis ? kpis.newInquiries + kpis.awaitingQuotes : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.newInquiries ?? 0} yeni • {kpis?.awaitingQuotes ?? 0} RFQ
            sürecinde
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Test Laboratuvarında
            </p>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">
            {kpis ? kpis.inTestLab : "—"}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {kpis?.passedTests ?? 0} onaylı test sertifikası
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Toplam Ciro
            </p>
            <div className="w-8 h-8 rounded-xl bg-navy-900/5 text-navy-900 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">
            {kpis ? formatTRY(kpis.totalRevenue) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Güvence &amp; sipariş toplamı</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Net Kâr
            </p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {kpis ? formatTRY(kpis.totalNetProfit) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Kargo maliyeti düşülmüş</p>
        </div>
      </section>

      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-800">
          {errorMsg}
        </div>
      )}

      {forbiddenInquiries ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-xs">
          <FlaskConical className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-navy-900">
            Test Teknisyeni Görünümü
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            RFQ fiyatlama kuyruğu Operatör ve Yönetici yetkisine açıktır.
            Tezgâh test işlemleriniz için Test Laboratuvarı ekranına geçebilirsiniz.
          </p>
          <Link
            href="/admin/test-lab"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Test Laboratuvarına Git</span>
          </Link>
        </div>
      ) : (
        /* 2-Column Main Workspace */
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Inquiry Queue */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>Talep Kuyruğu ({filteredInquiries.length})</span>
                </h2>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Talep kodu, parça no, marka veya telefon ara..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {FILTER_TABS.map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? "bg-navy-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Talepler yükleniyor...
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Bu filtreye uygun talep bulunamadı.
                </div>
              ) : (
                filteredInquiries.map((item) => {
                  const isSelected = item.id === selectedInquiryId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedInquiryId(item.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/70 border-l-4 border-l-orange-500"
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-navy-900">
                              {item.code}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusPillClass(
                                item.status
                              )}`}
                            >
                              {INQUIRY_STATUS_LABELS[item.status] ||
                                item.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                            {item.brand || "Marka Belirsiz"}{" "}
                            {item.partCode ? `• ${item.partCode}` : ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {item.customerName || "Müşteri"} •{" "}
                            {item.customerPhone}
                          </p>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                              item.offers.length > 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.offers.length} Teklif
                          </span>
                          {item.customerOfferPrice && (
                            <p className="text-xs font-bold text-navy-900">
                              {formatTRY(item.customerOfferPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: RfqComparePanel */}
          <div className="lg:col-span-7">
            <RfqComparePanel
              inquiry={selectedInquiry}
              onUpdated={() => loadData(true)}
            />
          </div>
        </section>
      )}

      {/* Bottom Strip: Recent Notification Logs */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-navy-900">
              Son Bildirim Kayıtları (SMS / WhatsApp / Panel)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Son {notifications.length} işlem
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Henüz bildirim kaydı bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {notifications.map((log) => (
              <div
                key={log.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                      log.channel === "WHATSAPP"
                        ? "bg-emerald-100 text-emerald-800"
                        : log.channel === "SMS"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-navy-900/10 text-navy-900"
                    }`}
                  >
                    {log.channel}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-navy-900">
                        {log.recipient}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {log.template}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-2">
                      <MessageSquare className="w-3 h-3 inline mr-1 text-slate-400" />
                      {log.message}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right text-[11px] text-slate-400 font-mono">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
