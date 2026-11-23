import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OtoBeyinPazari.com — Test Garantili & Merkezi Tedarikli Oto Beyin Platformu",
  description:
    "Türkiye'nin ilk test garantili, merkezi tedarikli, faturalı ve tek tip kargolamalı oto beyin (ECU, TCU, ABS, BCM, Airbag) platformu. 14 gün koşulsuz iade ve güvence hesabı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
