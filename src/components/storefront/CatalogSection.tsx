"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Tag,
} from "lucide-react";
import { PART_CATEGORIES, formatTRY } from "@/types/domain";

export interface CatalogPartItem {
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
  condition: string;
  imageUrl: string | null;
  referencePrice: number | null;
  isFeatured: boolean;
}

export interface CatalogSectionProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectPart: (part: CatalogPartItem) => void;
  onAskMissingPart: (searchedCode: string, category: string) => void;
}

const PAGE_SIZE = 12;

const BRAND_PILLS = [
  "ALL",
  "Fiat",
  "Renault",
  "Volkswagen",
  "Ford",
  "Mercedes-Benz",
  "BMW",
  "Opel",
  "Peugeot",
  "Citroën",
  "Hyundai",
  "Kia",
  "Toyota",
  "Honda",
  "Nissan",
  "Volvo",
  "Dacia",
];

function getManufacturerColor(manufacturer: string): string {
  const m = manufacturer.toLowerCase();
  if (m.includes("bosch")) return "bg-red-50 text-red-700 border-red-200";
  if (m.includes("continental"))
    return "bg-amber-50 text-amber-800 border-amber-200";
  if (m.includes("ate")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (m.includes("magneti"))
    return "bg-cyan-50 text-cyan-800 border-cyan-200";
  if (m.includes("valeo"))
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getCategoryLabel(code: string): string {
  return PART_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export function CatalogSection({
  activeCategory,
  onSelectCategory,
  onSelectPart,
  onAskMissingPart,
}: CatalogSectionProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState("ALL");
  const [items, setItems] = useState<CatalogPartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setVisibleCount(PAGE_SIZE);
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (activeCategory && activeCategory !== "ALL") {
          params.set("category", activeCategory);
        }
        if (activeBrand && activeBrand !== "ALL") {
          params.set("brand", activeBrand);
        }
        const res = await fetch(`/api/catalog?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Katalog verileri alınamadı.");
        }
        const data = await res.json();
        if (!cancelled) {
          const nextItems = Array.isArray(data.items) ? data.items : [];
          setItems(nextItems);
          setTotal(
            typeof data.total === "number" ? data.total : nextItems.length
          );
        }
      } catch {
        if (!cancelled) {
          setError("Katalog yüklenirken bir hata oluştu.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeCategory, activeBrand]);

  return (
    <section id="katalog" className="space-y-5">
      {/* Section Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
              Test Garantili Beyin &amp; Elektronik Modül Kataloğu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              OEM, HW/SW veya araç modeliyle arayın; tüm ürünler laboratuvar
              testinden geçirilerek tek tip kargoyla gönderilir.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full self-start lg:self-auto shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{loading ? "Aranıyor..." : `${total} Doğrulanmış Parça`}</span>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beyin Kodu (örn: A646 150 00 00, 0AM927769D), OEM / HW / SW veya Araç Modeli ara..."
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Brand Filter Pills + Category Select */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {BRAND_PILLS.map((brand) => {
              const selected = activeBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveBrand(brand)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    selected
                      ? "bg-navy-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {brand === "ALL" ? "Tümü" : brand}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="catalog-category-filter"
              className="text-xs font-semibold text-slate-500"
            >
              Kategori:
            </label>
            <select
              id="catalog-category-filter"
              value={activeCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-navy-900 outline-none focus:border-orange-500"
            >
              <option value="ALL">Tümü</option>
              {PART_CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error / Results */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-sm font-medium">
            Katalog ve çapraz referans kodları taranıyor...
          </span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 text-sm font-medium">
          {error}
        </div>
      ) : items.length === 0 ? (
        /* Empty State: Katalogda Yoksa Anında Sor */
        <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
              {query.trim()
                ? `"${query.trim()}" katalogda doğrudan eşleşmedi`
                : "Seçili filtrede parça bulunamadı"}
            </h3>
            <p className="text-sm text-slate-700">
              Aradığınız parça kodu katalogda görünmüyor mu?{" "}
              <strong className="text-navy-900">
                50+ onaylı tedarikçimizden 15-30 dakikada test onaylı fiyat
                bulalım!
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                onAskMissingPart(query.trim(), activeCategory || "ECU")
              }
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <span>Bu Parçayı Hemen Sor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveBrand("ALL");
                onSelectCategory("ALL");
              }}
              className="px-4 py-3 rounded-xl border border-orange-300 bg-white hover:bg-orange-100/60 text-navy-900 text-sm font-semibold transition-colors cursor-pointer"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.slice(0, visibleCount).map((part) => (
              <article
                key={part.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual ECU Header / Placeholder */}
                <div className="p-4 pb-3 space-y-3">
                  <div className="relative h-36 rounded-xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/80 border border-slate-200/80 flex flex-col items-center justify-center p-3 overflow-hidden">
                    {/* Manufacturer Badge */}
                    <span
                      className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${getManufacturerColor(
                        part.manufacturer
                      )}`}
                    >
                      {part.manufacturer}
                    </span>

                    {/* Category Pill */}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-navy-900/90 text-white text-[10px] font-bold">
                      {part.category}
                    </span>

                    {/* Stylized ECU Chip Graphic */}
                    <div className="w-16 h-16 rounded-xl bg-navy-900 text-orange-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform mt-2">
                      <Cpu className="w-9 h-9" />
                    </div>
                    <span className="mt-2 font-mono text-xs font-bold text-navy-900 tracking-tight bg-white/90 px-2.5 py-0.5 rounded border border-slate-200">
                      {part.oemCode}
                    </span>
                  </div>

                  {/* Brand & Model */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                      {part.brand} • {getCategoryLabel(part.category)}
                    </div>
                    <h3 className="text-sm font-bold text-navy-900 mt-0.5 line-clamp-2 min-h-[2.5rem]">
                      {part.model}
                      {part.yearRange ? ` (${part.yearRange})` : ""}
                    </h3>
                  </div>

                  {/* HW / SW Cross-Ref Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {part.hwCode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                        HW: {part.hwCode}
                      </span>
                    )}
                    {part.swCode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                        SW: {part.swCode}
                      </span>
                    )}
                    {part.engineCode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy-900/5 text-navy-900 text-[10px] font-semibold">
                        {part.engineCode}
                      </span>
                    )}
                  </div>

                  {/* Trust Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Test Garantili • 14 Gün İade</span>
                  </div>
                </div>

                {/* Footer: Reference Price + CTA */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">
                      Referans Fiyat
                    </div>
                    <div className="text-sm font-extrabold text-navy-900 flex items-center gap-1">
                      {part.referencePrice ? (
                        <span>{formatTRY(part.referencePrice)}</span>
                      ) : (
                        <span className="text-xs font-bold text-orange-600 inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Teklif Alınız
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPart(part)}
                    className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer shrink-0"
                  >
                    Fiyat &amp; Stok Sor
                  </button>
                </div>
              </article>
            ))}
          </div>

          {items.length > visibleCount && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-navy-900 text-navy-900 text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                Daha Fazla Göster ({items.length - visibleCount} parça daha)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Persistent Bottom CTA Banner: Katalogda Yoksa Anında Sor */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-2 border-orange-300 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-navy-900">
              Aradığınız parça kodu katalogda görünmüyor mu?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
              50+ onaylı tedarikçimizden{" "}
              <strong className="text-orange-600">
                15-30 dakikada test onaylı fiyat
              </strong>{" "}
              bulalım!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onAskMissingPart(query.trim(), activeCategory || "ECU")
          }
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <span>Katalogda Yoksa Anında Sor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
