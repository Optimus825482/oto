"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileSpreadsheet,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Presentation,
  RefreshCw,
  Repeat,
  Save,
  Settings,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";

interface SystemSettingsState {
  enableCoreExchange: boolean;
  coreDepositAmount: number;
  enableVinProgramming: boolean;
  vinProgrammingFee: number;
  enableB2bDealers: boolean;
  b2bDiscountPercent: number;
}

interface SupplierApplicationRow {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  city: string;
  district: string | null;
  specialtyBrands: string[];
  monthlyStock: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

interface B2BApplicationRow {
  id: string;
  serviceName: string;
  contactName: string;
  phone: string;
  email: string | null;
  city: string;
  taxNumber: string | null;
  monthlyVolume: string | null;
  specialtyBrands: string[];
  status: string;
  createdAt: string;
}

const DEFAULT_SETTINGS: SystemSettingsState = {
  enableCoreExchange: true,
  coreDepositAmount: 1500,
  enableVinProgramming: true,
  vinProgrammingFee: 1500,
  enableB2bDealers: true,
  b2bDiscountPercent: 8,
};

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Onaylandı
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5" />
        Reddedildi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      Beklemede
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function formatDateTR(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [userRole, setUserRole] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"supplier" | "b2b">("supplier");
  const [supplierApps, setSupplierApps] = useState<SupplierApplicationRow[]>([]);
  const [b2bApps, setB2bApps] = useState<B2BApplicationRow[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [busyAppKey, setBusyAppKey] = useState<string | null>(null);
  const [appsFeedback, setAppsFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const [settingsRes, meRes] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data?.settings) {
          setSettings(data.settings);
        }
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserRole(meData?.user?.role ?? null);
      }
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/admin/applications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSupplierApps(data.supplierApplications ?? []);
        setB2bApps(data.b2bApplications ?? []);
      }
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadApplications();
  }, [loadSettings, loadApplications]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableCoreExchange: settings.enableCoreExchange,
          coreDepositAmount: Number(settings.coreDepositAmount) || 0,
          enableVinProgramming: settings.enableVinProgramming,
          vinProgrammingFee: Number(settings.vinProgrammingFee) || 0,
          enableB2bDealers: settings.enableB2bDealers,
          b2bDiscountPercent: Number(settings.b2bDiscountPercent) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsFeedback({
          type: "error",
          text: data.error || "Sistem ayarları kaydedilemedi.",
        });
        return;
      }
      if (data?.settings) {
        setSettings(data.settings);
      }
      setSettingsFeedback({
        type: "success",
        text: "Yüksek kârlı modül ayarları başarıyla kaydedildi ve vitrine yansıtıldı.",
      });
    } catch {
      setSettingsFeedback({
        type: "error",
        text: "Ayarlar kaydedilirken bağlantı hatası oluştu.",
      });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleUpdateApplicationStatus(
    type: "supplier" | "b2b",
    id: string,
    status: "APPROVED" | "REJECTED" | "PENDING"
  ) {
    const key = `${type}:${id}`;
    setBusyAppKey(key);
    setAppsFeedback(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppsFeedback({
          type: "error",
          text: data.error || "Başvuru durumu güncellenemedi.",
        });
        return;
      }
      if (type === "supplier") {
        setSupplierApps((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      } else {
        setB2bApps((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
      setAppsFeedback({
        type: "success",
        text:
          status === "APPROVED"
            ? "Başvuru onaylandı."
            : status === "REJECTED"
            ? "Başvuru reddedildi."
            : "Başvuru beklemede durumuna alındı.",
      });
    } catch {
      setAppsFeedback({
        type: "error",
        text: "Durum güncellenirken bir hata oluştu.",
      });
    } finally {
      setBusyAppKey(null);
    }
  }

  const pendingSuppliers = supplierApps.filter((a) => a.status === "PENDING").length;
  const pendingB2b = b2bApps.filter((a) => a.status === "PENDING").length;
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950/5 text-navy-900 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5 text-orange-500" />
            <span>Platform Yönetimi &amp; Strateji</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-950">
            Sistem Ayarları &amp; Başvurular
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Yüksek kârlı gelir modüllerini tek tıkla açıp kapatın, yönetici sunumlarına erişin ve gelen başvuruları yönetin.
          </p>
        </div>
      </div>

      {/* Section 1: High-Margin Feature Flags */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-navy-950">
              Yüksek Kârlı Modüller (Feature Flags — Aktif / Pasif)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Değişiklikler anında müşteri vitrini, teklif ödeme ekranı ve B2B başvuru akışlarına yansır.
            </p>
          </div>
          {userRole && !isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Ayar değişikliği için ADMIN yetkisi gerekir</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
          {loadingSettings ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span>Sistem ayarları yükleniyor...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: Core Exchange */}
              <div
                className={`rounded-2xl border p-5 transition-colors flex flex-col justify-between gap-4 ${
                  settings.enableCoreExchange
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center shrink-0">
                      <Repeat className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          settings.enableCoreExchange
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {settings.enableCoreExchange ? "Aktif" : "Pasif"}
                      </span>
                      <ToggleSwitch
                        checked={settings.enableCoreExchange}
                        onChange={(val) =>
                          setSettings((s) => ({ ...s, enableCoreExchange: val }))
                        }
                        label="Eski Beyin İadesi Modülü"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-navy-950">
                      Eski Beyin İadesi (Core Exchange / Depozito)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Müşteri arızalı eski beynini gönderdiğinde iade/indirim uygulanan döngüsel stok ve revizyon modeli.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Depozito / İade Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={settings.coreDepositAmount}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        coreDepositAmount: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Card 2: VIN Programming */}
              <div
                className={`rounded-2xl border p-5 transition-colors flex flex-col justify-between gap-4 ${
                  settings.enableVinProgramming
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          settings.enableVinProgramming
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {settings.enableVinProgramming ? "Aktif" : "Pasif"}
                      </span>
                      <ToggleSwitch
                        checked={settings.enableVinProgramming}
                        onChange={(val) =>
                          setSettings((s) => ({ ...s, enableVinProgramming: val }))
                        }
                        label="Şaseye Göre Programlama Modülü"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-navy-950">
                      Şaseye Göre Programlama / Klonlama (Tak-Çalıştır)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sipariş öncesi immobilizer / VIN yazılımı klonlanarak tak-çalıştır teslimat ek hizmeti.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Programlama Ek Ücreti (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={settings.vinProgrammingFee}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        vinProgrammingFee: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Card 3: B2B Dealers */}
              <div
                className={`rounded-2xl border p-5 transition-colors flex flex-col justify-between gap-4 ${
                  settings.enableB2bDealers
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          settings.enableB2bDealers
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {settings.enableB2bDealers ? "Aktif" : "Pasif"}
                      </span>
                      <ToggleSwitch
                        checked={settings.enableB2bDealers}
                        onChange={(val) =>
                          setSettings((s) => ({ ...s, enableB2bDealers: val }))
                        }
                        label="B2B Bayi ve Cari Modülü"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-navy-950">
                      Özel Servisler İçin B2B Bayi &amp; Cari Modülü
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Oto elektrikçiler ve özel servisler için B2B bayi başvurusu ve sabit iskonto programı.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    B2B Bayi İskonto Oranı (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={settings.b2bDiscountPercent}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        b2bDiscountPercent: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {settingsFeedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                settingsFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {settingsFeedback.text}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loadingSettings || savingSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingSettings ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Presentations & Strategy Docs */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-navy-950">
            Sunumlar &amp; Strateji Dokümanları (Sadece Admin Erişimli)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Yatırımcı, yönetim kurulu ve iş ortağı görüşmeleri için hazırlanan interaktif sunumlar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a
            href="/sunum"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-navy-950 text-white p-6 border border-white/10 shadow-sm hover:border-orange-500/60 transition-all flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Presentation className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold group-hover:text-orange-400 transition-colors">
                Proje &amp; İş Modeli Sunumu
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                OtoBeyinPazari merkezi tedarik mimarisi, Güvence Hesabı, Test Lab doğrulama süreci ve kâr simülatörü.
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-orange-400 shrink-0 mt-1" />
          </a>

          <a
            href="/sunum-global"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-navy-900 text-white p-6 border border-white/10 shadow-sm hover:border-orange-500/60 transition-all flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold group-hover:text-orange-400 transition-colors">
                Global Rakipler &amp; Artı/Eksi Analizi
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ACtronics, ECU Testing, Flagship One, Ovoko ve B-Parts karşılaştırması ile SWOT strateji raporu.
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-orange-400 shrink-0 mt-1" />
          </a>

          <a
            href="/sunum-yatirim"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-gradient-to-br from-navy-950 to-navy-800 text-white p-6 border border-orange-500/30 shadow-sm hover:border-orange-400 transition-all flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Presentation className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold group-hover:text-orange-400 transition-colors">
                Cihaz Listesi &amp; Yatırım (ROI) Sunumu
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test merkezi cihazları (AutoTuner, Flex, MST-9000+, Autel), 3 kademeli kurulum bütçesi ve geri dönüş hesaplayıcısı.
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-orange-400 shrink-0 mt-1" />
          </a>
        </div>
      </section>

      {/* Section 3: Supplier & B2B Applications */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-navy-950">
              Gelen Tedarikçi &amp; B2B Servis Başvuruları
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Vitrin üzerinden gelen çıkma/beyin tedarikçisi ve özel servis B2B başvurularını inceleyip onaylayın.
            </p>
          </div>
          <button
            type="button"
            onClick={loadApplications}
            disabled={loadingApps}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-navy-950 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? "animate-spin" : ""}`} />
            <span>Listeyi Yenile</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("supplier")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "supplier"
                ? "border-orange-500 text-navy-950"
                : "border-transparent text-slate-500 hover:text-navy-950"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tedarikçi Başvuruları</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              {supplierApps.length}
            </span>
            {pendingSuppliers > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                {pendingSuppliers} Yeni
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("b2b")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "b2b"
                ? "border-orange-500 text-navy-950"
                : "border-transparent text-slate-500 hover:text-navy-950"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>B2B Servis Başvuruları</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              {b2bApps.length}
            </span>
            {pendingB2b > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                {pendingB2b} Yeni
              </span>
            )}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {appsFeedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                appsFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {appsFeedback.text}
            </div>
          )}

          {loadingApps ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span>Başvurular yükleniyor...</span>
            </div>
          ) : activeTab === "supplier" ? (
            supplierApps.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Henüz tedarikçi başvurusu bulunmuyor.
              </div>
            ) : (
              <div className="space-y-4">
                {supplierApps.map((app) => {
                  const busy = busyAppKey === `supplier:${app.id}`;
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-bold text-base text-navy-950">
                            {app.companyName}
                          </h3>
                          <StatusBadge status={app.status} />
                          <span className="text-xs text-slate-400">
                            {formatDateTR(app.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                          <span className="font-medium text-navy-900">
                            Yetkili: {app.contactName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {app.phone}
                          </span>
                          {app.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {app.email}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.city}
                            {app.district ? ` / ${app.district}` : ""}
                          </span>
                          {app.monthlyStock && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                              Aylık Stok: {app.monthlyStock}
                            </span>
                          )}
                        </div>

                        {app.specialtyBrands.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {app.specialtyBrands.map((b) => (
                              <span
                                key={b}
                                className="px-2 py-0.5 rounded-md bg-navy-950/5 text-navy-900 text-[11px] font-semibold"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}

                        {app.note && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                            {app.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busy || app.status === "APPROVED"}
                          onClick={() =>
                            handleUpdateApplicationStatus("supplier", app.id, "APPROVED")
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Onayla</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy || app.status === "REJECTED"}
                          onClick={() =>
                            handleUpdateApplicationStatus("supplier", app.id, "REJECTED")
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reddet</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : b2bApps.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Henüz B2B servis başvurusu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {b2bApps.map((app) => {
                const busy = busyAppKey === `b2b:${app.id}`;
                return (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-bold text-base text-navy-950">
                          {app.serviceName}
                        </h3>
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-slate-400">
                          {formatDateTR(app.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                        <span className="font-medium text-navy-900">
                          Yetkili: {app.contactName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {app.phone}
                        </span>
                        {app.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {app.email}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {app.city}
                        </span>
                        {app.taxNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            VKN: {app.taxNumber}
                          </span>
                        )}
                        {app.monthlyVolume && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            Aylık Hacim: {app.monthlyVolume}
                          </span>
                        )}
                      </div>

                      {app.specialtyBrands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.specialtyBrands.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-md bg-navy-950/5 text-navy-900 text-[11px] font-semibold"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy || app.status === "APPROVED"}
                        onClick={() =>
                          handleUpdateApplicationStatus("b2b", app.id, "APPROVED")
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Onayla</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy || app.status === "REJECTED"}
                        onClick={() =>
                          handleUpdateApplicationStatus("b2b", app.id, "REJECTED")
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reddet</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
