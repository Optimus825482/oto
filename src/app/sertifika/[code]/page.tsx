"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Printer,
  ShieldCheck,
  Award,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";

interface CertificateData {
  serialNo: string;
  hologramSealCode: string;
  physicalCheckOk: boolean;
  pinCheckOk: boolean;
  canObdCheckOk: boolean;
  testedAt: string;
  notes: string | null;
  certificateCode: string;
  qrDataUrl: string;
  orderNo: string;
  partCode: string | null;
  brand: string | null;
  vin: string | null;
  invoiceNo: string | null;
  returnDeadlineAt: string | null;
}

export default function CertificatePage() {
  const params = useParams<{ code: string }>();
  const certCode = params?.code ? decodeURIComponent(params.code) : "";

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCertificate() {
      if (!certCode) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/certificates/${encodeURIComponent(certCode)}`
        );
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(json.error || "Geçerli test sertifikası bulunamadı.");
          }
          return;
        }
        if (!cancelled) {
          setCert(json.certificate);
        }
      } catch {
        if (!cancelled) {
          setError("Sertifika verileri yüklenirken bağlantı hatası oluştu.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadCertificate();
    return () => {
      cancelled = true;
    };
  }, [certCode]);

  const checkItems = cert
    ? [
        {
          label: "Fiziksel & Lehim Kontrolü",
          sub: "PCB yüzey, nem/oksit ve komponent bütünlüğü",
          ok: cert.physicalCheckOk,
        },
        {
          label: "Pin & Devre Kontrolü",
          sub: "Soket pinleri, besleme ve kısa devre izolasyonu",
          ok: cert.pinCheckOk,
        },
        {
          label: "CAN/OBD Tezgâh Haberleşme Testi",
          sub: "Diagnostik bağlantı, EEPROM & aktüatör sinyali",
          ok: cert.canObdCheckOk,
        },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
        {/* Action Bar (hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Link
            href="/takip"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy-900 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sipariş Takibine Dön</span>
          </Link>

          {cert && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Sertifikayı Yazdır / PDF Kaydet</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-14 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-medium">
              QR Test &amp; Garanti Sertifikası doğrulanıyor...
            </span>
          </div>
        ) : error || !cert ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-extrabold text-navy-900">
              Sertifika Doğrulanamadı ({certCode})
            </h1>
            <p className="text-sm text-slate-600">
              {error || "Bu sertifika kodu sistemde bulunamadı."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          /* Printable Official Certificate Card */
          <article className="bg-white rounded-3xl border-4 border-navy-900 shadow-xl overflow-hidden">
            {/* Top Certificate Banner */}
            <div className="bg-navy-900 text-white px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-orange-500">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/logo-main.jpg"
                  alt="OtoBeyinPazari.com"
                  className="h-12 sm:h-14 w-auto bg-white rounded-xl p-1.5 object-contain"
                />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
                    Resmi Laboratuvar Onay Belgesi
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Dijital Test &amp; Garanti Sertifikası
                  </h1>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold shadow-xs">
                  <Award className="w-4 h-4" />
                  <span>TEST ONAYLI (PASS)</span>
                </div>
                <div className="font-mono text-xs text-slate-300 mt-1.5">
                  {cert.certificateCode}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-10 space-y-8">
              {/* Top Grid: Core Metadata + QR Code */}
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">
                      Sipariş Numarası
                    </div>
                    <div className="font-mono text-base font-extrabold text-navy-900 mt-0.5">
                      {cert.orderNo}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">
                      Parça / OEM Kodu
                    </div>
                    <div className="font-mono text-base font-extrabold text-navy-900 mt-0.5">
                      {cert.partCode || "-"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">
                      Araç Marka &amp; Şase (VIN)
                    </div>
                    <div className="text-sm font-extrabold text-navy-900 mt-0.5">
                      {cert.brand || "-"}
                    </div>
                    <div className="font-mono text-xs text-slate-600 mt-0.5">
                      {cert.vin || "VIN belirtilmedi"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">
                      Cihaz Seri No &amp; Hologram Mühür
                    </div>
                    <div className="font-mono text-sm font-extrabold text-navy-900 mt-0.5">
                      {cert.serialNo}
                    </div>
                    <div className="font-mono text-xs font-bold text-orange-600 mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Mühür: {cert.hologramSealCode}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Box */}
                <div className="shrink-0 flex flex-col items-center p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                  <img
                    src={cert.qrDataUrl}
                    alt={`Sertifika QR Kodu ${cert.certificateCode}`}
                    className="w-40 h-40 rounded-lg bg-white p-1 border border-slate-200"
                  />
                  <span className="mt-2 font-mono text-xs font-extrabold text-navy-900">
                    {cert.certificateCode}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    QR ile Anlık Doğrulama
                  </span>
                </div>
              </div>

              {/* 3 Green Checkmarks: Bench Lab Results */}
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900 border-b border-slate-200 pb-2">
                  Merkez Test Laboratuvarı Kontrol Sonuçları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {checkItems.map((item) => (
                    <div
                      key={item.label}
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        item.ok
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.ok
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-300 text-white"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold leading-snug">
                          {item.label}
                        </div>
                        <p className="text-xs text-emerald-800/80 mt-0.5">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technician Notes */}
              {cert.notes && (
                <div className="p-4 rounded-2xl bg-navy-900/5 border border-navy-900/10">
                  <div className="text-xs font-bold uppercase text-navy-900 mb-1">
                    Baş Teknisyen Laboratuvar Notu
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {cert.notes}
                  </p>
                </div>
              )}

              {/* Bottom Legal / E-Invoice / 14-Day Return Warranty Bar */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
                <div>
                  <div className="font-bold text-slate-500 uppercase">
                    Resmi E-Fatura No
                  </div>
                  <div className="font-mono text-sm font-extrabold text-navy-900 mt-0.5">
                    {cert.invoiceNo || "Düzenleniyor"}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-500 uppercase">
                    Test Tarihi
                  </div>
                  <div className="text-sm font-bold text-navy-900 mt-0.5">
                    {new Date(cert.testedAt).toLocaleString("tr-TR")}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-orange-500 shrink-0" />
                  <div>
                    <div className="font-extrabold text-navy-900">
                      14 Gün İade Güvencesi
                    </div>
                    <div className="text-[11px] font-semibold text-orange-800">
                      {cert.returnDeadlineAt
                        ? `Son Tarih: ${new Date(
                            cert.returnDeadlineAt
                          ).toLocaleDateString("tr-TR")}`
                        : "Hologram mühür bozulmadan geçerlidir"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
