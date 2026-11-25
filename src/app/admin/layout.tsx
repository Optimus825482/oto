import type { Metadata, Viewport } from "next";
import React from "react";
import AdminShell from "@/components/admin/AdminShell";

export const viewport: Viewport = {
  themeColor: "#061529",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "OtoBeyin Admin & Test Operasyon Merkezi",
  description:
    "Toplu RFQ, tedarikçi teklif kıyaslama, test laboratuvarı, OEM arşivi, E-Fatura ve kargo yönetim uygulaması.",
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OBP Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
