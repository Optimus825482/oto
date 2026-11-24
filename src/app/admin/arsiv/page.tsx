"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Download,
  Factory,
  FileSpreadsheet,
  FilterX,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PART_CATEGORIES, formatTRY } from "@/types/domain";

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
  condition?: string;
  imageUrl?: string | null;
  referencePrice: number | null;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CatalogStats {
  totalAll: number;
  featuredCount: number;
  brandCount: number;
  manufacturerCount: number;
  brands: string[];
  manufacturers: string[];
  categoryCounts: Record<string, number>;
}

interface CatalogResponse {
  items?: CatalogPartRow[];
  parts?: CatalogPartRow[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  stats?: Partial<CatalogStats>;
}

interface PartFormState {
  oemCode: string;
  hwCode: string;
  swCode: string;
  crossRefCodes: string;
  category: string;
  brand: string;
  model: string;
  yearRange: string;
  engineCode: string;
  manufacturer: string;
  referencePrice: string;
  isFeatured: boolean;
}

const PAGE_LIMIT = 25;

const EMPTY_FORM: PartFormState = {
  oemCode: "",
  hwCode: "",
  swCode: "",
  crossRefCodes: "",
  category: "ECU",
  brand: "",
  model: "",
  yearRange: "",
  engineCode: "",
  manufacturer: "",
  referencePrice: "",
  isFeatured: false,
};

const EMPTY_STATS: CatalogStats = {
  totalAll: 0,
  featuredCount: 0,
  brandCount: 0,
  manufacturerCount: 0,
  brands: [],
  manufacturers: [],
  categoryCounts: {},
};

const CATEGORY_MAP = new Map<string, string>(
  PART_CATEGORIES.map((c) => [c.code, c.label])
);

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  ECU: "bg-navy-900/10 text-navy-900 border-navy-900/15",
  TCU: "bg-orange-100 text-orange-700 border-orange-200",
  ABS: "bg-rose-50 text-rose-700 border-rose-200",
  BCM: "bg-sky-50 text-sky-700 border-sky-200",
  SRS: "bg-amber-50 text-amber-800 border-amber-200",
  SENSOR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IMMOBILIZER: "bg-violet-50 text-violet-700 border-violet-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\r\n;]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export default function AdminArchivePage() {
  // Filters & pagination
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Data state
  const [items, setItems] = useState<CatalogPartRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<CatalogStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busyFeaturedId, setBusyFeaturedId] = useState<string | null>(null);

  // Page-level feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Add / Edit modal
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<CatalogPartRow | null>(null);
  const [partForm, setPartForm] = useState<PartFormState>(EMPTY_FORM);
  const [savingPart, setSavingPart] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Bulk import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<CatalogPartRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSeqRef = useRef(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery((prev) => {
        if (prev !== searchInput) {
          setPage(1);
        }
        return searchInput;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const buildFilterParams = useCallback(
    (targetPage: number, targetLimit: number) => {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (brandFilter) params.set("brand", brandFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (manufacturerFilter) params.set("manufacturer", manufacturerFilter);
      if (featuredOnly) params.set("featured", "true");
      params.set("page", String(targetPage));
      params.set("limit", String(targetLimit));
      return params.toString();
    },
    [debouncedQuery, brandFilter, categoryFilter, manufacturerFilter, featuredOnly]
  );

  const loadCatalog = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    try {
      const query = buildFilterParams(page, PAGE_LIMIT);
      const res = await fetch(`/api/admin/catalog?${query}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (seq === fetchSeqRef.current) {
          setFeedback({
            type: "error",
            text: "Katalog verileri alınırken bir hata oluştu.",
          });
        }
        return;
      }
      const data = (await res.json()) as CatalogResponse;
      if (seq !== fetchSeqRef.current) return;

      const resolvedItems = data.items ?? data.parts ?? [];
      const resolvedTotal =
        typeof data.total === "number" ? data.total : resolvedItems.length;
      const resolvedTotalPages =
        typeof data.totalPages === "number" && data.totalPages > 0
          ? data.totalPages
          : Math.max(1, Math.ceil(resolvedTotal / PAGE_LIMIT));

      setItems(resolvedItems);
      setTotal(resolvedTotal);
      setTotalPages(resolvedTotalPages);
      setStats({
        totalAll: data.stats?.totalAll ?? resolvedTotal,
        featuredCount:
          data.stats?.featuredCount ??
          resolvedItems.filter((p) => p.isFeatured).length,
        brandCount:
          data.stats?.brandCount ?? (data.stats?.brands?.length ?? 0),
        manufacturerCount:
          data.stats?.manufacturerCount ??
          (data.stats?.manufacturers?.length ?? 0),
        brands: data.stats?.brands ?? [],
        manufacturers: data.stats?.manufacturers ?? [],
        categoryCounts: data.stats?.categoryCounts ?? {},
      });
    } catch {
      if (seq === fetchSeqRef.current) {
        setFeedback({
          type: "error",
          text: "Sunucu ile bağlantı kurulamadı.",
        });
      }
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  }, [buildFilterParams, page]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      brandFilter ||
      manufacturerFilter ||
      categoryFilter ||
      featuredOnly
  );

  function clearFilters() {
    setSearchInput("");
    setDebouncedQuery("");
    setBrandFilter("");
    setManufacturerFilter("");
    setCategoryFilter("");
    setFeaturedOnly(false);
    setPage(1);
  }

  function handleCategoryClick(code: string) {
    setCategoryFilter((prev) => (prev === code ? "" : code));
    setPage(1);
  }

  function openAddModal() {
    setEditingPart(null);
    setPartForm(EMPTY_FORM);
    setModalError(null);
    setPartModalOpen(true);
  }

  function openEditModal(part: CatalogPartRow) {
    setEditingPart(part);
    setPartForm({
      oemCode: part.oemCode,
      hwCode: part.hwCode ?? "",
      swCode: part.swCode ?? "",
      crossRefCodes: part.crossRefCodes.join(", "),
      category: part.category,
      brand: part.brand,
      model: part.model,
      yearRange: part.yearRange ?? "",
      engineCode: part.engineCode ?? "",
      manufacturer: part.manufacturer,
      referencePrice:
        part.referencePrice != null ? String(part.referencePrice) : "",
      isFeatured: part.isFeatured,
    });
    setModalError(null);
    setPartModalOpen(true);
  }

  async function handleSavePart(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (
      !partForm.oemCode.trim() ||
      !partForm.brand.trim() ||
      !partForm.model.trim() ||
      !partForm.manufacturer.trim()
    ) {
      setModalError("OEM Kodu, Marka, Model ve Üretici alanları zorunludur.");
      return;
    }

    const parsedPrice = partForm.referencePrice.trim()
      ? Number(partForm.referencePrice.trim())
      : undefined;
    if (
      parsedPrice !== undefined &&
      (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
    ) {
      setModalError("Referans fiyat pozitif bir sayı olmalıdır.");
      return;
    }

    const crossRefCodes = partForm.crossRefCodes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSavingPart(true);
    try {
      const isEdit = Boolean(editingPart);
      const endpoint = isEdit
        ? `/api/admin/catalog/${editingPart!.id}`
        : "/api/admin/catalog";
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit
        ? {
            oemCode: partForm.oemCode.trim(),
            hwCode: partForm.hwCode.trim() || null,
            swCode: partForm.swCode.trim() || null,
            crossRefCodes,
            category: partForm.category,
            brand: partForm.brand.trim(),
            model: partForm.model.trim(),
            yearRange: partForm.yearRange.trim() || null,
            engineCode: partForm.engineCode.trim() || null,
            manufacturer: partForm.manufacturer.trim(),
            referencePrice: parsedPrice ?? null,
            isFeatured: partForm.isFeatured,
          }
        : {
            oemCode: partForm.oemCode.trim(),
            hwCode: partForm.hwCode.trim() || undefined,
            swCode: partForm.swCode.trim() || undefined,
            crossRefCodes,
            category: partForm.category,
            brand: partForm.brand.trim(),
            model: partForm.model.trim(),
            yearRange: partForm.yearRange.trim() || undefined,
            engineCode: partForm.engineCode.trim() || undefined,
            manufacturer: partForm.manufacturer.trim(),
            referencePrice: parsedPrice,
            isFeatured: partForm.isFeatured,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(
          data.error ||
            (isEdit ? "Parça güncellenemedi." : "Parça eklenemedi.")
        );
        return;
      }

      setPartModalOpen(false);
      setFeedback({
        type: "success",
        text: isEdit
          ? `${partForm.oemCode.trim()} kaydı başarıyla güncellendi.`
          : `${data.part?.oemCode ?? partForm.oemCode.trim()} OEM arşivine eklendi.`,
      });
      await loadCatalog();
    } catch {
      setModalError("Sunucu ile bağlantı kurulamadı.");
    } finally {
      setSavingPart(false);
    }
  }

  async function handleToggleFeatured(part: CatalogPartRow) {
    setBusyFeaturedId(part.id);
    setFeedback(null);
    const nextFeatured = !part.isFeatured;
    try {
      const res = await fetch(`/api/admin/catalog/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Vitrin durumu güncellenemedi.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: `${part.oemCode} ${
          nextFeatured
            ? "vitrin öne çıkanlarına eklendi."
            : "vitrin öne çıkanlarından çıkarıldı."
        }`,
      });
      await loadCatalog();
    } catch {
      setFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setBusyFeaturedId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/catalog/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Parça kaydı silinemedi.",
        });
        setDeleteTarget(null);
        return;
      }
      const deletedCode = deleteTarget.oemCode;
      setDeleteTarget(null);
      setFeedback({
        type: "success",
        text: `${deletedCode} kaydı OEM arşivinden silindi.`,
      });
      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await loadCatalog();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    setFeedback(null);
    try {
      const query = buildFilterParams(1, 1000);
      const res = await fetch(`/api/admin/catalog?${query}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: "Dışa aktarma için katalog verileri alınamadı.",
        });
        return;
      }
      const data = (await res.json()) as CatalogResponse;
      const exportRows = data.items ?? data.parts ?? [];

      const header = [
        "oemCode",
        "hwCode",
        "swCode",
        "crossRefCodes",
        "category",
        "brand",
        "model",
        "yearRange",
        "engineCode",
        "manufacturer",
        "referencePrice",
        "isFeatured",
      ];

      const lines = [
        header.join(","),
        ...exportRows.map((row) =>
          [
            escapeCsvCell(row.oemCode),
            escapeCsvCell(row.hwCode),
            escapeCsvCell(row.swCode),
            escapeCsvCell(row.crossRefCodes.join("|")),
            escapeCsvCell(row.category),
            escapeCsvCell(row.brand),
            escapeCsvCell(row.model),
            escapeCsvCell(row.yearRange),
            escapeCsvCell(row.engineCode),
            escapeCsvCell(row.manufacturer),
            escapeCsvCell(row.referencePrice),
            escapeCsvCell(row.isFeatured ? "true" : "false"),
          ].join(",")
        ),
      ];

      const csvContent = "\uFEFF" + lines.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `otobeyin-oem-arsivi-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: "success",
        text: `${exportRows.length} kayıt CSV dosyası olarak indirildi.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "CSV dışa aktarma sırasında bir hata oluştu.",
      });
    } finally {
      setExporting(false);
    }
  }

  function handleDownloadSampleCsv() {
    const sampleRows = [
      "oemCode,hwCode,swCode,crossRefCodes,category,brand,model,yearRange,engineCode,manufacturer,referencePrice,isFeatured",
      "0281014236,EDC16C34,1037386166,9664843780|0281013872,ECU,Peugeot,308 1.6 HDi,2007-2013,9HZ,Bosch,12500,true",
      "237100720R,SID305,S180067103,8201092458|237101507R,ECU,Renault,Megane III 1.5 dCi,2009-2016,K9K,Continental,14200,false",
      "0AM927769D,DQ200,0AM300048Q,0AM927769G|0AM325025M,TCU,Volkswagen,Golf VI 1.4 TSI DSG,2009-2013,CAXA,Bosch,18500,true",
      "55252432,MJD8F3,2243P324,55246583|BC0105302D,ECU,Fiat,Egea 1.3 Multijet,2015-2021,199B1000,Magneti Marelli,11800,false",
    ];
    const csvContent = "\uFEFF" + sampleRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "otobeyin-oem-sablon.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleBulkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFeedback(null);
    try {
      const content = await file.text();
      setBulkText(content);
      setBulkFileName(file.name);
    } catch {
      setBulkFeedback({
        type: "error",
        text: "Dosya okunamadı. Lütfen UTF-8 formatında CSV veya JSON dosyası seçin.",
      });
    } finally {
      e.target.value = "";
    }
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    setBulkFeedback(null);

    const trimmed = bulkText.trim();
    if (!trimmed) {
      setBulkFeedback({
        type: "error",
        text: "Lütfen bir CSV/JSON dosyası yükleyin veya metin alanına veri yapıştırın.",
      });
      return;
    }

    let payload: Record<string, unknown>;
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          payload = { items: parsed };
        } else if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed.items)
        ) {
          payload = { items: parsed.items };
        } else if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.csvText === "string"
        ) {
          payload = { csvText: parsed.csvText };
        } else {
          setBulkFeedback({
            type: "error",
            text: "JSON verisi bir dizi [...] veya { items: [...] } biçiminde olmalıdır.",
          });
          return;
        }
      } catch {
        setBulkFeedback({
          type: "error",
          text: "Geçersiz JSON sözdizimi. Lütfen veriyi kontrol edin.",
        });
        return;
      }
    } else {
      payload = { csvText: bulkText };
    }

    setBulkImporting(true);
    try {
      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkFeedback({
          type: "error",
          text: data.error || "Toplu içe aktarma başarısız oldu.",
        });
        return;
      }

      const skippedSuffix =
        typeof data.skipped === "number" && data.skipped > 0
          ? ` (${data.skipped} geçersiz satır atlandı)`
          : "";
      const summaryText = `${data.inserted ?? 0} yeni parça eklendi, ${
        data.updated ?? 0
      } güncellendi (Toplam: ${data.total ?? 0} parça)${skippedSuffix}`;

      setBulkFeedback({
        type: "success",
        text: summaryText,
      });
      setBulkText("");
      setBulkFileName(null);
      setPage(1);
      await loadCatalog();
    } catch {
      setBulkFeedback({
        type: "error",
        text: "Sunucu ile bağlantı kurulamadı.",
      });
    } finally {
      setBulkImporting(false);
    }
  }

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const endIndex = Math.min(total, page * PAGE_LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-orange-500" />
            <span>OEM &amp; Beyin Arşivi</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistemde toplam{" "}
            <span className="font-bold text-navy-900">{stats.totalAll}</span>{" "}
            doğrulanmış OEM parça, HW/SW kodu ve çapraz referans kaydı bulunuyor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-navy-900" />
            <span>{exporting ? "Hazırlanıyor..." : "CSV Dışa Aktar"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBulkFeedback(null);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-orange-400" />
            <span>Toplu CSV / JSON Yükle</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Parça Ekle</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-center justify-between gap-3 ${
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
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
            aria-label="Bildirimi kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Toplam OEM Parça
            </p>
            <p className="text-2xl font-extrabold text-navy-900 mt-1">
              {stats.totalAll}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-navy-900/10 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-navy-900" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Marka Sayısı</p>
            <p className="text-2xl font-extrabold text-navy-900 mt-1">
              {stats.brandCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-sky-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Üretici Sayısı
            </p>
            <p className="text-2xl font-extrabold text-navy-900 mt-1">
              {stats.manufacturerCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Factory className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Vitrin Öne Çıkan
            </p>
            <p className="text-2xl font-extrabold text-orange-600 mt-1">
              {stats.featuredCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCategoryFilter("");
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
            categoryFilter === ""
              ? "bg-navy-900 text-white border-navy-900 shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span>Tümü</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              categoryFilter === ""
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {stats.totalAll}
          </span>
        </button>

        {PART_CATEGORIES.map((cat) => {
          const count = stats.categoryCounts[cat.code] ?? 0;
          const active = categoryFilter === cat.code;
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => handleCategoryClick(cat.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                active
                  ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{cat.code}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="OEM, HW, SW, çapraz kod, model veya motor kodu..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Marka filtresi"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            >
              <option value="">Tüm Markalar</option>
              {stats.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={manufacturerFilter}
              onChange={(e) => {
                setManufacturerFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Üretici filtresi"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            >
              <option value="">Tüm Üreticiler</option>
              {stats.manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 flex flex-wrap items-center justify-between lg:justify-end gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-navy-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => {
                  setFeaturedOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <span>Sadece Vitrin</span>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 disabled:opacity-40 cursor-pointer transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">OEM &amp; Çapraz Kodlar</th>
                <th className="py-3.5 px-4">HW / SW</th>
                <th className="py-3.5 px-4">Marka &amp; Model / Motor</th>
                <th className="py-3.5 px-4">Kategori &amp; Üretici</th>
                <th className="py-3.5 px-4 text-right">Referans Fiyat</th>
                <th className="py-3.5 px-4 text-center">Vitrin</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    OEM arşivi yükleniyor...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    Seçili filtrelere uygun parça kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((part) => {
                  const badgeStyle =
                    CATEGORY_BADGE_STYLES[part.category] ||
                    CATEGORY_BADGE_STYLES.OTHER;
                  const isFeaturedBusy = busyFeaturedId === part.id;
                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-sm font-extrabold text-navy-900">
                          {part.oemCode}
                        </p>
                        {part.crossRefCodes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-[260px]">
                            {part.crossRefCodes.map((code) => (
                              <span
                                key={code}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/70"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 mt-1 inline-block">
                            Çapraz kod yok
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {part.hwCode || part.swCode ? (
                          <div className="space-y-1">
                            {part.hwCode && (
                              <p className="text-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 mr-1">
                                  HW
                                </span>
                                {part.hwCode}
                              </p>
                            )}
                            {part.swCode && (
                              <p className="text-slate-600">
                                <span className="text-[10px] font-bold text-slate-400 mr-1">
                                  SW
                                </span>
                                {part.swCode}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-navy-900">{part.brand}</p>
                        <p className="text-slate-700 mt-0.5">{part.model}</p>
                        {(part.yearRange || part.engineCode) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                            {part.yearRange && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                                {part.yearRange}
                              </span>
                            )}
                            {part.engineCode && (
                              <span className="font-mono px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold">
                                {part.engineCode}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle}`}
                          title={
                            CATEGORY_MAP.get(part.category) || part.category
                          }
                        >
                          {part.category}
                        </span>
                        <p className="text-slate-700 font-semibold mt-1.5">
                          {part.manufacturer}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-navy-900 whitespace-nowrap">
                        {part.referencePrice != null
                          ? formatTRY(part.referencePrice)
                          : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={isFeaturedBusy}
                          onClick={() => handleToggleFeatured(part)}
                          title={
                            part.isFeatured
                              ? "Vitrinden çıkar"
                              : "Vitrinde öne çıkar"
                          }
                          aria-label={
                            part.isFeatured
                              ? "Vitrinden çıkar"
                              : "Vitrinde öne çıkar"
                          }
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                            part.isFeatured
                              ? "bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100"
                              : "bg-white border-slate-200 text-slate-300 hover:text-orange-400 hover:border-orange-200"
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              part.isFeatured ? "fill-orange-500" : ""
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(part)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-navy-900 hover:text-white text-navy-900 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(part)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              OEM arşivi yükleniyor...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Seçili filtrelere uygun parça kaydı bulunamadı.
            </div>
          ) : (
            items.map((part) => {
              const badgeStyle =
                CATEGORY_BADGE_STYLES[part.category] ||
                CATEGORY_BADGE_STYLES.OTHER;
              const isFeaturedBusy = busyFeaturedId === part.id;
              return (
                <div key={part.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-extrabold text-navy-900">
                          {part.oemCode}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                        >
                          {part.category}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {part.brand} {part.model}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Üretici: {part.manufacturer}
                        {part.yearRange ? ` · ${part.yearRange}` : ""}
                        {part.engineCode ? ` · ${part.engineCode}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isFeaturedBusy}
                      onClick={() => handleToggleFeatured(part)}
                      aria-label={
                        part.isFeatured
                          ? "Vitrinden çıkar"
                          : "Vitrinde öne çıkar"
                      }
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${
                        part.isFeatured
                          ? "bg-orange-50 border-orange-200 text-orange-500"
                          : "bg-white border-slate-200 text-slate-300"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          part.isFeatured ? "fill-orange-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {(part.hwCode || part.swCode) && (
                    <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                      {part.hwCode && <span>HW: {part.hwCode}</span>}
                      {part.swCode && <span>SW: {part.swCode}</span>}
                    </div>
                  )}

                  {part.crossRefCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {part.crossRefCodes.map((code) => (
                        <span
                          key={code}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-navy-900">
                      {part.referencePrice != null
                        ? formatTRY(part.referencePrice)
                        : "Fiyat Belirtilmemiş"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(part)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-navy-900 text-xs font-bold cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(part)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-600">
            {total > 0
              ? `Toplam ${total} kayıttan ${startIndex}–${endIndex} arası gösteriliyor`
              : "Gösterilecek kayıt bulunamadı"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-navy-900 disabled:opacity-40 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Önceki</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900">
              Sayfa {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-navy-900 disabled:opacity-40 cursor-pointer transition-colors"
            >
              <span>Sonraki</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {partModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => {
            if (!savingPart) setPartModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold">
                  {editingPart
                    ? `OEM Parça Düzenle (${editingPart.oemCode})`
                    : "Yeni OEM / Beyin Parçası Ekle"}
                </h2>
              </div>
              <button
                type="button"
                disabled={savingPart}
                onClick={() => setPartModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePart}
              className="p-5 space-y-4 overflow-y-auto"
            >
              {modalError && (
                <div className="rounded-xl px-4 py-3 text-xs sm:text-sm font-medium bg-rose-50 text-rose-900 border border-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    OEM Kodu *
                  </label>
                  <input
                    type="text"
                    required
                    value={partForm.oemCode}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, oemCode: e.target.value }))
                    }
                    placeholder="Örn: 0281014236"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={partForm.category}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, category: e.target.value }))
                    }
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
                    Donanım Kodu (HW)
                  </label>
                  <input
                    type="text"
                    value={partForm.hwCode}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, hwCode: e.target.value }))
                    }
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
                    value={partForm.swCode}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, swCode: e.target.value }))
                    }
                    placeholder="Örn: 1037386166"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Araç Markası *
                  </label>
                  <input
                    type="text"
                    required
                    value={partForm.brand}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, brand: e.target.value }))
                    }
                    placeholder="Örn: Peugeot"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={partForm.model}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, model: e.target.value }))
                    }
                    placeholder="Örn: 308 1.6 HDi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Yıl Aralığı
                  </label>
                  <input
                    type="text"
                    value={partForm.yearRange}
                    onChange={(e) =>
                      setPartForm((f) => ({ ...f, yearRange: e.target.value }))
                    }
                    placeholder="Örn: 2007-2013"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Motor Kodu
                  </label>
                  <input
                    type="text"
                    value={partForm.engineCode}
                    onChange={(e) =>
                      setPartForm((f) => ({
                        ...f,
                        engineCode: e.target.value,
                      }))
                    }
                    placeholder="Örn: 9HZ / K9K"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Beyin Üreticisi *
                  </label>
                  <input
                    type="text"
                    required
                    value={partForm.manufacturer}
                    onChange={(e) =>
                      setPartForm((f) => ({
                        ...f,
                        manufacturer: e.target.value,
                      }))
                    }
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
                    step="1"
                    value={partForm.referencePrice}
                    onChange={(e) =>
                      setPartForm((f) => ({
                        ...f,
                        referencePrice: e.target.value,
                      }))
                    }
                    placeholder="Örn: 12500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Çapraz Parça Kodları (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={partForm.crossRefCodes}
                    onChange={(e) =>
                      setPartForm((f) => ({
                        ...f,
                        crossRefCodes: e.target.value,
                      }))
                    }
                    placeholder="Örn: 9664843780, 0281013872, EDC16C34"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={partForm.isFeatured}
                      onChange={(e) =>
                        setPartForm((f) => ({
                          ...f,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-navy-900">
                      Müşteri vitrininde öne çıkar (Vitrin Ürünü)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={savingPart}
                  onClick={() => setPartModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingPart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {savingPart
                      ? "Kaydediliyor..."
                      : editingPart
                        ? "Değişiklikleri Kaydet"
                        : "Parçayı Arşive Ekle"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV / JSON Import Modal */}
      {importModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => {
            if (!bulkImporting) setImportModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold">
                  Toplu CSV / JSON İçe Aktar
                </h2>
              </div>
              <button
                type="button"
                disabled={bulkImporting}
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleBulkImport}
              className="p-5 space-y-4 overflow-y-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  Virgül (<code>,</code>) veya noktalı virgül (<code>;</code>)
                  ayrımlı CSV ya da JSON yükleyin. Çapraz kodları{" "}
                  <code>|</code> veya boşlukla ayırabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                  <span>Örnek CSV İndir</span>
                </button>
              </div>

              {bulkFeedback && (
                <div
                  className={`rounded-xl px-4 py-3 text-xs sm:text-sm font-medium border flex items-start gap-2 ${
                    bulkFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-rose-50 text-rose-900 border-rose-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bulkFeedback.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-navy-900 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-orange-500" />
                  <span>
                    {bulkFileName
                      ? `Seçili Dosya: ${bulkFileName}`
                      : "CSV / JSON Dosyası Seç (.csv, .json, .txt)"}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleBulkFileChange}
                    className="sr-only"
                  />
                </label>

                {bulkText && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkText("");
                      setBulkFileName(null);
                      setBulkFeedback(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Temizle
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  CSV veya JSON İçeriği
                </label>
                <textarea
                  rows={7}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={
                    "oemCode,hwCode,swCode,crossRefCodes,category,brand,model,yearRange,engineCode,manufacturer,referencePrice,isFeatured\n0281014236,EDC16C34,1037386166,9664843780|0281013872,ECU,Peugeot,308 1.6 HDi,2007-2013,9HZ,Bosch,12500,true"
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={bulkImporting}
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={bulkImporting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>
                    {bulkImporting ? "Aktarılıyor..." : "Arşive Toplu Aktar"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Parça Kaydını Sil
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  <span className="font-mono font-bold text-navy-900">
                    {deleteTarget.oemCode}
                  </span>{" "}
                  ({deleteTarget.brand} {deleteTarget.model}) kaydını kalıcı
                  olarak silmek istediğinize emin misiniz?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? "Siliniyor..." : "Evet, Sil"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
