"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Cpu,
  CarFront,
  ArrowRight,
  Loader2,
  AlertCircle,
  Truck,
  Microscope,
  ReceiptText,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { PART_CATEGORIES, formatTRY } from "@/types/domain";

interface OfferDetails {
  code: string;
  partCode: string | null;
  vin: string | null;
  brand: string | null;
  category: string;
  status: string;
  customerOfferPrice: number | null;
  createdAt: string;
  orderNo: string | null;
  paymentStatus: string | null;
}

interface PaidOrderResult {
  orderNo: string;
  status: string;
  paymentStatus: string;
  paymentRef: string;
  customerPrice: number;
}

function getCategoryLabel(code: string): string {
  return PART_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export default function OfferPaymentPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";

  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [invoiceType, setInvoiceType] = useState<"INDIVIDUAL" | "CORPORATE">(
    "INDIVIDUAL"
  );
  const [companyTitle, setCompanyTitle] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<PaidOrderResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOffer() {
      if (!token) return;
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/offers/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(json.error || "Teklif bulunamadı.");
          }
          return;
        }
        if (!cancelled) {
          setOffer(json.offer);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Teklif bilgileri yüklenirken bağlantı hatası oluştu.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadOffer();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function fillDemoSandboxCard() {
    setCardHolderName("EMRE KARAHAN");
    setCardNumber("4543 6000 0000 1234");
    setCardExpiry("12/28");
    setCardCvc("842");
    if (!deliveryAddress.trim()) {
      setDeliveryAddress(
        "İkitelli OSB Atatürk Oto Sanayi Sitesi 12. Blok No:4 Başakşehir / İstanbul"
      );
    }
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    setPayError(null);

    if (deliveryAddress.trim().length < 10) {
      setPayError("Lütfen en az 10 karakterlik eksiksiz teslimat adresi giriniz.");
      return;
    }
    if (cardHolderName.trim().length < 2) {
      setPayError("Lütfen kart üzerindeki ad soyad bilgisini giriniz.");
      return;
    }
    if (cardNumber.replace(/\D/g, "").length < 12) {
      setPayError("Lütfen geçerli bir kart numarası giriniz.");
      return;
    }
    if (!cardExpiry.trim() || !cardCvc.trim()) {
      setPayError("Lütfen son kullanma tarihi (SKT) ve CVC kodunu giriniz.");
      return;
    }

    setPaying(true);
    try {
      const taxInfo =
        invoiceType === "CORPORATE"
          ? {
              companyTitle: companyTitle.trim() || undefined,
              taxNumber: taxNumber.trim() || undefined,
              taxOffice: taxOffice.trim() || undefined,
            }
          : undefined;

      const res = await fetch(`/api/offers/${encodeURIComponent(token)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardHolderName: cardHolderName.trim(),
          cardNumber: cardNumber.trim(),
          deliveryAddress: deliveryAddress.trim(),
          invoiceType,
          taxInfo,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPayError(json.error || "Ödeme işlemi tamamlanamadı.");
        return;
      }

      setPaidOrder(json.order);
    } catch {
      setPayError("Ödeme sırasında sunucuyla iletişim kurulamadı.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-14 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-medium">
              Test onaylı teklifiniz yükleniyor...
            </span>
          </div>
        ) : loadError || !offer ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-extrabold text-navy-900">
              Teklif Görüntülenemedi
            </h1>
            <p className="text-sm text-slate-600">
              {loadError || "Bu teklif bağlantısı geçersiz veya süresi dolmuş."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : paidOrder || offer.orderNo ? (
          /* Success / Already Paid Confirmation Card */
          <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-lg p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                  GÜVENCE HESABI ÖDEMESİ ONAYLANDI
                </span>
                <h1 className="text-2xl font-extrabold text-navy-900">
                  Siparişiniz Oluşturuldu:{" "}
                  <span className="font-mono text-orange-600">
                    {paidOrder?.orderNo || offer.orderNo}
                  </span>
                </h1>
                <p className="text-sm text-slate-600">
                  Ödemeniz{" "}
                  <strong className="text-navy-900">
                    OtoBeyinPazari Güvence Hesabına
                  </strong>{" "}
                  alındı. Parçanız merkez test laboratuvarımıza sevk edilmek
                  üzere işleme alındı.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Talep Takip Kodu
                </div>
                <div className="font-mono font-bold text-navy-900">
                  {offer.code}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Ödenen Tutar (KDV &amp; Kargo Dahil)
                </div>
                <div className="font-extrabold text-emerald-700">
                  {formatTRY(
                    paidOrder?.customerPrice ?? offer.customerOfferPrice ?? 0
                  )}
                </div>
              </div>
              {paidOrder?.paymentRef && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-slate-500">
                    Güvence İşlem Referansı
                  </div>
                  <div className="font-mono font-bold text-navy-900">
                    {paidOrder.paymentRef}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/takip/${offer.code}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold shadow-sm transition-colors"
              >
                <span>8 Adım Canlı Sipariş Takibine Git</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </Link>
              <Link
                href="/"
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
              >
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        ) : (
          /* Offer Summary + Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Offer Details & Escrow Guarantee */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-navy-900 px-5 py-4 text-white">
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Size Özel Test Onaylı Teklif
                  </div>
                  <h1 className="text-lg font-extrabold mt-0.5">
                    Talep Kodu:{" "}
                    <span className="font-mono">{offer.code}</span>
                  </h1>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-orange-500" />
                        Parça / Beyin Kodu
                      </span>
                      <span className="font-mono font-bold text-navy-900">
                        {offer.partCode || "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <CarFront className="w-4 h-4 text-navy-900" />
                        Araç / Kategori
                      </span>
                      <span className="font-bold text-navy-900 text-right">
                        {offer.brand || "Belirtilmedi"} •{" "}
                        {getCategoryLabel(offer.category)}
                      </span>
                    </div>

                    {offer.vin && (
                      <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-100">
                        <span className="text-slate-500">Şase (VIN)</span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {offer.vin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Box */}
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-orange-800 uppercase">
                      Toplam Müşteri Fiyatı
                    </div>
                    <div className="text-3xl font-extrabold text-navy-900 mt-1">
                      {offer.customerOfferPrice != null
                        ? formatTRY(offer.customerOfferPrice)
                        : "-"}
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                      KDV Dahil • Laboratuvar Testi Dahil • Tek Tip Anti-Statik
                      Kargo Dahil
                    </p>
                  </div>

                  {/* Escrow & 14-Day Return Guarantee Box */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Güvence Hesabı &amp; 14 Gün İade Kalkanı</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-900/90">
                      <li className="flex items-start gap-2">
                        <Microscope className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Parça önce merkezimizde CAN/OBD tezgâh testinden
                          geçer; arızalı çıkarsa size gönderilmez.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ReceiptText className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Test sonrası resmi E-Faturanız ve QR Test Sertifikanız
                          düzenlenir.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Teslimattan itibaren 14 gün koşulsuz uyum / iade
                          güvencesi uygulanır.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Checkout Form */}
            <form
              onSubmit={handleSubmitPayment}
              className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span>Teslimat, Fatura &amp; Güvenli Ödeme</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    256-Bit SSL Sandbox 3D Secure Korumalı Güvence Hesabı
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fillDemoSandboxCard}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 text-navy-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Test Kartı &amp; Adres Doldur
                </button>
              </div>

              {payError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{payError}</span>
                </div>
              )}

              {/* 1. Delivery Address */}
              <div>
                <label
                  htmlFor="delivery-address"
                  className="block text-xs font-bold text-navy-900 uppercase tracking-wide mb-1.5"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Teslimat Adresi *
                  </span>
                </label>
                <textarea
                  id="delivery-address"
                  rows={3}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Servis veya açık teslimat adresinizi il/ilçe ile birlikte giriniz..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm text-slate-900"
                />
              </div>

              {/* 2. Invoice Type Toggle */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-navy-900 uppercase tracking-wide">
                  Fatura Tipi
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInvoiceType("INDIVIDUAL")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      invoiceType === "INDIVIDUAL"
                        ? "border-orange-500 bg-orange-50 text-navy-900 ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4 text-orange-500 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold">
                        Bireysel E-Arşiv
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Adınıza resmi fatura
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvoiceType("CORPORATE")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      invoiceType === "CORPORATE"
                        ? "border-orange-500 bg-orange-50 text-navy-900 ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-navy-900 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold">
                        Kurumsal E-Fatura
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Şirket / Oto Servis
                      </div>
                    </div>
                  </button>
                </div>

                {invoiceType === "CORPORATE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Firma Ünvanı (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={companyTitle}
                        onChange={(e) => setCompanyTitle(e.target.value)}
                        placeholder="Örn: Şahin Oto Elektronik Ltd. Şti."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Vergi Numarası / TCKN
                      </label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="10 veya 11 haneli no"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Vergi Dairesi
                      </label>
                      <input
                        type="text"
                        value={taxOffice}
                        onChange={(e) => setTaxOffice(e.target.value)}
                        placeholder="Örn: Maslak"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Sandbox 3D Secure Card Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    Kart Bilgileri (Sandbox 3D Secure)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Güvence Hesabı Korumalı
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="card-holder"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Kart Sahibi
                  </label>
                  <input
                    id="card-holder"
                    type="text"
                    required
                    value={cardHolderName}
                    onChange={(e) =>
                      setCardHolderName(e.target.value.toUpperCase())
                    }
                    placeholder="AD SOYAD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm font-semibold uppercase"
                  />
                </div>

                <div>
                  <label
                    htmlFor="card-number"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Kart Numarası
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4543 6000 0000 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm font-mono font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="card-expiry"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      SKT (AA/YY)
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      required
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card-cvc"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      CVC / CVV
                    </label>
                    <input
                      id="card-cvc"
                      type="text"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="842"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Güvence Hesabına İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      Güvence Hesabına Güvenli Öde (
                      {offer.customerOfferPrice != null
                        ? formatTRY(offer.customerOfferPrice)
                        : ""}
                      )
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
