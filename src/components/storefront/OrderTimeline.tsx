"use client";

import React from "react";
import {
  Cpu,
  Radio,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Truck,
  Microscope,
  PackageCheck,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react";

export interface OrderTimelineProps {
  status: string;
}

interface TimelineStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: TimelineStep[] = [
  {
    stepNumber: 1,
    title: "Beyin / Şase Sorgusu",
    subtitle: "Talep kaydı açıldı",
    icon: Cpu,
  },
  {
    stepNumber: 2,
    title: "Tedarikçilere Toplu Mesaj",
    subtitle: "Onaylı ağa yayınlandı",
    icon: Radio,
  },
  {
    stepNumber: 3,
    title: "Gizli Fiyat Teklifleri",
    subtitle: "En iyi parça seçiliyor",
    icon: Lock,
  },
  {
    stepNumber: 4,
    title: "Fiyatlandırma & SMS Teklif",
    subtitle: "Müşteri onayı bekleniyor",
    icon: MessageSquareText,
  },
  {
    stepNumber: 5,
    title: "Güvenli Ödeme — Güvence Hesabı",
    subtitle: "Ödeme korumalı hesapta",
    icon: ShieldCheck,
  },
  {
    stepNumber: 6,
    title: "Merkeze Kargo Sevki",
    subtitle: "Test merkezine yolda",
    icon: Truck,
  },
  {
    stepNumber: 7,
    title: "Sağlamlık Testi & Fatura",
    subtitle: "CAN/OBD tezgâh testi",
    icon: Microscope,
  },
  {
    stepNumber: 8,
    title: "Tek Tip Kargolama & Teslimat",
    subtitle: "QR sertifikalı & 14 gün iade",
    icon: PackageCheck,
  },
];

function getStepState(
  stepNum: number,
  status: string
): "completed" | "active" | "failed" | "pending" {
  const s = status.toUpperCase();

  if (s === "TEST_FAILED") {
    if (stepNum < 7) return "completed";
    if (stepNum === 7) return "failed";
    return "pending";
  }

  if (s === "DELIVERED") {
    return "completed";
  }

  let activeStep = 1;
  switch (s) {
    case "NEW":
      activeStep = 1;
      break;
    case "BROADCASTED":
      activeStep = 2;
      break;
    case "QUOTES_RECEIVED":
      activeStep = 3;
      break;
    case "OFFER_SENT":
      activeStep = 4;
      break;
    case "PAID":
      activeStep = 5;
      break;
    case "SUPPLIER_SHIPPED":
      activeStep = 6;
      break;
    case "IN_TEST_LAB":
      activeStep = 7;
      break;
    case "TEST_PASSED":
      // Step 7 test passed, Step 8 outbound shipping is next active step
      activeStep = 8;
      break;
    case "SHIPPED_TO_CUSTOMER":
      activeStep = 8;
      break;
    default:
      activeStep = 1;
      break;
  }

  if (stepNum < activeStep) return "completed";
  if (stepNum === activeStep) return "active";
  return "pending";
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const isFailed = status.toUpperCase() === "TEST_FAILED";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-navy-900">
            Canlı 8 Adım Sipariş &amp; Test Süreci
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Her parça size ulaşmadan önce OtoBeyinPazari merkez laboratuvarında
            sağlamlık testinden geçer.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Tamamlandı
          </span>
          <span className="inline-flex items-center gap-1 text-orange-600">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            Aktif Aşama
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            Bekliyor
          </span>
        </div>
      </div>

      {isFailed && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold">
              Laboratuvar Kalite Kalkanı Devreye Girdi
            </div>
            <p className="text-rose-800 mt-0.5">
              Testte arıza tespit edildi, size gönderilmeden yeni parça tedarik
              ediliyor. Ödemeniz güvence hesabında korunmaktadır.
            </p>
          </div>
        </div>
      )}

      {/* 8-Step Grid (Vertical on mobile, 4x2 or 8-step stepper on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STEPS.map((step) => {
          const state = getStepState(step.stepNumber, status);
          const Icon = step.icon;

          const cardStyles =
            state === "completed"
              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
              : state === "active"
                ? "bg-orange-50 border-orange-400 ring-2 ring-orange-500/20 text-navy-900"
                : state === "failed"
                  ? "bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 text-rose-950"
                  : "bg-slate-50/70 border-slate-200 text-slate-400";

          const iconWrapStyles =
            state === "completed"
              ? "bg-emerald-500 text-white"
              : state === "active"
                ? "bg-orange-500 text-white animate-pulse"
                : state === "failed"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-200 text-slate-500";

          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border p-4 transition-all relative ${cardStyles}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${iconWrapStyles}`}
                >
                  {state === "completed" ? (
                    <Check className="w-5 h-5" />
                  ) : state === "failed" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    state === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : state === "active"
                        ? "bg-orange-500 text-white"
                        : state === "failed"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200/80 text-slate-500"
                  }`}
                >
                  Adım {step.stepNumber}/8
                </span>
              </div>

              <h3
                className={`text-sm font-bold leading-snug ${
                  state === "pending" ? "text-slate-500" : "text-navy-900"
                }`}
              >
                {step.title}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {state === "completed" && (
                  <span className="text-emerald-700 font-semibold">
                    Tamamlandı
                  </span>
                )}
                {state === "active" && (
                  <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    İşlemde • {step.subtitle}
                  </span>
                )}
                {state === "failed" && (
                  <span className="text-rose-700 font-bold">
                    Testte arıza tespit edildi
                  </span>
                )}
                {state === "pending" && (
                  <span className="text-slate-400">{step.subtitle}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
