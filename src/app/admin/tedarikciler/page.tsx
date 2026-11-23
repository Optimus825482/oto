"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Database,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { PART_CATEGORIES, formatTRY } from "@/types/domain";

interface AdminSupplierRow {
  id: string;
  companyName: string;
  city: string;
  district: string | null;
  specialtyBrands: string[];
  rating: number;
  totalDelivered: number;
  defectCount: number;
  balance: number;
  isApproved: boolean;
  user: {
    email: string;
    fullName: string;
    phone: string | null;
  };
  _count: {
    orders: number;
    offers: number;
  };
}

interface CatalogPartRow {
  id: string;
  oemCode: string;
  normalizedCode: string;
  hwCode: string | null;
  swCode: string | null;
  crossRefCodes: string[];
  category: string;
  brand: string;
  model: string;
  yearRange: string | null;
  engineCode: string | null;
  manufacturer: string;
  referencePrice: number | null;
  isFeatured: boolean;
}

const CATEGORY_MAP = new Map(PART_CATEGORIES.map((c) => [c.code, c.label]));

export default function SuppliersAndCatalogPage() {
  const [activeTab, setActiveTab] = useState<"SUPPLIERS" | "CATALOG">(
    "SUPPLIERS"
  );

  // Suppliers state
  const [suppliers, setSuppliers] = useState<AdminSupplierRow[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierBusyId, setSupplierBusyId] = useState<string | null>(null);
  const [supplierFeedback, setSupplierFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Catalog state
  const [catalog, setCatalog] = useState<CatalogPartRow[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [creatingPart, setCreatingPart] = useState(false);
  const [catalogFeedback, setCatalogFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New catalog form fields
  const [oemCode, setOemCode] = useState("");
  const [hwCode, setHwCode] = useState("");
  const [swCode, setSwCode] = useState("");
  const [crossRefInput, setCrossRefInput] = useState("");
  const [category, setCategory] = useState<string>("ECU");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [referencePrice, setReferencePrice] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch("/api/admin/suppliers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers ?? []);
      }
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCatalog(data.parts ?? []);
      }
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
    loadCatalog();
  }, [loadSuppliers, loadCatalog]);

  async function handleToggleApproved(supplier: AdminSupplierRow) {
    setSupplierBusyId(supplier.id);
    setSupplierFeedback(null);
    try {
      const res = await fetch("/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.id,
          isApproved: !supplier.isApproved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSupplierFeedback({
          type: "error",
          text: data.error || "Tedarikçi durumu güncellenemedi.",
        });
        return;
      }
      setSupplierFeedback({
        type: "success",
        text: `${supplier.companyName} durumu "${
          !supplier.isApproved ? "Onaylı" : "Pasif"
        }" olarak güncellendi.`,
      });
      await loadSuppliers();
    } catch {
      setSupplierFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setSupplierBusyId(null);
    }
  }

  async function handlePayout(supplier: AdminSupplierRow) {
    setSupplierBusyId(supplier.id);
    setSupplierFeedback(null);
    try {
      const res = await fetch(`/api/admin/suppliers/${supplier.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setSupplierFeedback({
          type: "error",
          text: data.error || "Hakediş ödemesi yapılamadı.",
        });
        return;
      }
      setSupplierFeedback({
        type: "success",
        text: `${supplier.companyName} firmasına ${formatTRY(
          data.paidAmount ?? supplier.balance
        )} hakediş ödemesi işlendi.`,
      });
      await loadSuppliers();
    } catch {
      setSupplierFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setSupplierBusyId(null);
    }
  }

  async function handleCreatePart(e: React.FormEvent) {
    e.preventDefault();
    setCatalogFeedback(null);

    if (
      !oemCode.trim() ||
      !brand.trim() ||
      !model.trim() ||
      !manufacturer.trim()
    ) {
      setCatalogFeedback({
        type: "error",
        text: "OEM Kodu, Marka, Model ve Üretici alanları zorunludur.",
      });
      return;
    }

    const crossRefCodes = crossRefInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setCreatingPart(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oemCode: oemCode.trim(),
          hwCode: hwCode.trim() || undefined,
          swCode: swCode.trim() || undefined,
          crossRefCodes,
          category,
          brand: brand.trim(),
          model: model.trim(),
          manufacturer: manufacturer.trim(),
          referencePrice: referencePrice.trim()
            ? Number(referencePrice)
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCatalogFeedback({
          type: "error",
          text: data.error || "Parça eklenemedi.",
        });
        return;
      }

      setCatalogFeedback({
        type: "success",
        text: `${data.part?.oemCode ?? oemCode} katalog ve çapraz referans veritabanına eklendi.`,
      });

      setOemCode("");
      setHwCode("");
      setSwCode("");
      setCrossRefInput("");
      setBrand("");
      setModel("");
      setManufacturer("");
      setReferencePrice("");
      await loadCatalog();
    } catch {
      setCatalogFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setCreatingPart(false);
    }
  }

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.oemCode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.crossRefCodes.some((c) => c.toLowerCase().includes(q))
    );
  }, [catalog, catalogSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-orange-500" />
            <span>Tedarikçi Ağı &amp; Katalog Yönetimi</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Onaylı beyinci tedarikçilerin yetki, puan ve hakedişlerini yönetin;
            çapraz OEM parça kataloğunu genişletin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadSuppliers();
            loadCatalog();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 text-sm font-semibold shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-orange-500" />
          <span>Yenile</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("SUPPLIERS")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "SUPPLIERS"
              ? "bg-navy-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Onaylı Tedarikçi Ağı &amp; Hakediş ({suppliers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CATALOG")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "CATALOG"
              ? "bg-navy-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. Katalog &amp; Çapraz Parça Kodu DB ({catalog.length})</span>
        </button>
      </div>

      {/* TAB 1: SUPPLIERS */}
      {activeTab === "SUPPLIERS" && (
        <div className="space-y-4">
          {supplierFeedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-start gap-2 ${
                supplierFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{supplierFeedback.text}</span>
            </div>
          )}

          {loadingSuppliers ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Tedarikçiler yükleniyor...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Kayıtlı tedarikçi bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((sup) => {
                const isBusy = supplierBusyId === sup.id;
                return (
                  <div
                    key={sup.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-navy-900">
                              {sup.companyName}
                            </h2>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sup.isApproved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {sup.isApproved ? "Onaylı" : "Pasif"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {sup.city}
                              {sup.district ? ` / ${sup.district}` : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              {sup.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Cari Bakiye
                          </p>
                          <p className="text-lg font-extrabold text-navy-900">
                            {formatTRY(sup.balance)}
                          </p>
                        </div>
                      </div>

                      {/* Brands */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {sup.specialtyBrands.length > 0 ? (
                          sup.specialtyBrands.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            Tüm markalar
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <div>
                          <p className="text-[11px] text-slate-500">Teslimat</p>
                          <p className="text-sm font-bold text-emerald-700">
                            {sup.totalDelivered}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500">
                            Arızalı / İade
                          </p>
                          <p className="text-sm font-bold text-rose-600">
                            {sup.defectCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500">Teklifler</p>
                          <p className="text-sm font-bold text-navy-900">
                            {sup._count.offers}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleApproved(sup)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                          sup.isApproved
                            ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                            : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {sup.isApproved ? "Pasife Al" : "Onaylı Yap"}
                        </span>
                      </button>

                      {sup.balance > 0 && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handlePayout(sup)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Hakediş Öde ({formatTRY(sup.balance)})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG */}
      {activeTab === "CATALOG" && (
        <div className="space-y-6">
          {/* Compact Create Form */}
          <form
            onSubmit={handleCreatePart}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-500" />
                <span>Yeni OEM / Parça Ekle</span>
              </h2>
              <span className="text-xs text-slate-400">
                Çapraz kodları virgülle ayırın
              </span>
            </div>

            {catalogFeedback && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-start gap-2 ${
                  catalogFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{catalogFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  OEM Kodu *
                </label>
                <input
                  type="text"
                  value={oemCode}
                  onChange={(e) => setOemCode(e.target.value)}
                  placeholder="Örn: 0281014236"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Donanım Kodu (HW)
                </label>
                <input
                  type="text"
                  value={hwCode}
                  onChange={(e) => setHwCode(e.target.value)}
                  placeholder="Örn: EDC16C34"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Yazılım Kodu (SW)
                </label>
                <input
                  type="text"
                  value={swCode}
                  onChange={(e) => setSwCode(e.target.value)}
                  placeholder="Örn: 1037386166"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                >
                  {PART_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Araç Markası *
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Örn: Peugeot / Citroën"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Örn: 308 1.6 HDi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Beyin Üreticisi *
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Örn: Bosch, Continental, Valeo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Referans Fiyat (₺)
                </label>
                <input
                  type="number"
                  min={0}
                  value={referencePrice}
                  onChange={(e) => setReferencePrice(e.target.value)}
                  placeholder="Örn: 12500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Çapraz Parça Kodları (Virgülle)
                </label>
                <input
                  type="text"
                  value={crossRefInput}
                  onChange={(e) => setCrossRefInput(e.target.value)}
                  placeholder="Örn: 9664843780, EDC16C34"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingPart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingPart ? "Ekleniyor..." : "Kataloğa Ekle"}</span>
              </button>
            </div>
          </form>

          {/* Catalog List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-navy-900">
                Kayıtlı Parçalar ({filteredCatalog.length})
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="OEM, çapraz kod, marka ara..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">OEM / HW / SW</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Marka &amp; Model</th>
                    <th className="py-3 px-4">Üretici</th>
                    <th className="py-3 px-4">Çapraz Kodlar</th>
                    <th className="py-3 px-4 text-right">Ref. Fiyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingCatalog ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        Katalog yükleniyor...
                      </td>
                    </tr>
                  ) : filteredCatalog.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        Kayıtlı parça bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-navy-900">
                            {part.oemCode}
                          </p>
                          {(part.hwCode || part.swCode) && (
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                              {part.hwCode ? `HW: ${part.hwCode}` : ""}{" "}
                              {part.swCode ? `SW: ${part.swCode}` : ""}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {CATEGORY_MAP.get(part.category as never) ||
                            part.category}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {part.brand}
                          </p>
                          <p className="text-slate-500">{part.model}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {part.manufacturer}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {part.crossRefCodes.length > 0 ? (
                              part.crossRefCodes.map((code) => (
                                <span
                                  key={code}
                                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                                >
                                  {code}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-navy-900">
                          {part.referencePrice
                            ? formatTRY(part.referencePrice)
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
