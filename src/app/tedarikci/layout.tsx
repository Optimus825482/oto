import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SupplierShell from "@/components/supplier/SupplierShell";

export const viewport: Viewport = {
  themeColor: "#0A2240",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "OtoBeyin Tedarikçi Portalı — Kapalı Ağ",
  description:
    "Onaylı tedarikçiler için anlık toplu beyin talepleri (RFQ), hızlı teklif, merkez kargo kodu ve cari hesap takip uygulaması.",
  manifest: "/manifest-tedarikci.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OBP Tedarikçi",
  },
};

export default function TedarikciLayout({ children }: { children: ReactNode }) {
  return <SupplierShell>{children}</SupplierShell>;
}
