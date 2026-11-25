"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";
import {
  Activity,
  Building2,
  Database,
  ExternalLink,
  FlaskConical,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

export interface AdminUser {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "OPERATOR" | "TECHNICIAN" | "SUPPLIER" | "CUSTOMER";
}

const ALLOWED_ROLES = new Set(["ADMIN", "OPERATOR", "TECHNICIAN"]);

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Sistem Yöneticisi",
  OPERATOR: "Operasyon Uzmanı",
  TECHNICIAN: "Test Teknisyeni",
};

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Operasyon & Toplu RFQ",
    icon: Activity,
    exact: true,
  },
  {
    href: "/admin/test-lab",
    label: "Test Laboratuvarı",
    icon: FlaskConical,
    exact: false,
  },
  {
    href: "/admin/siparisler",
    label: "Sipariş, Kargo & E-Fatura",
    icon: PackageCheck,
    exact: false,
  },
  {
    href: "/admin/arsiv",
    label: "OEM & Beyin Arşivi",
    icon: Database,
    exact: false,
  },
  {
    href: "/admin/tedarikciler",
    label: "Tedarikçiler & Katalog",
    icon: Building2,
    exact: false,
  },
  {
    href: "/admin/ayarlar",
    label: "Sistem Ayarları",
    icon: Settings,
    exact: false,
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/giris");
          return;
        }
        const data = await res.json();
        const me = data?.user as AdminUser | null | undefined;
        if (!me || !ALLOWED_ROLES.has(me.role)) {
          router.replace("/giris");
          return;
        }
        if (active) {
          setUser(me);
          setCheckingAuth(false);
        }
      } catch {
        router.replace("/giris");
      }
    }
    verifySession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/giris");
    }
  }

  function isActiveLink(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (checkingAuth || !user) {
    return (
      <BrandLoadingScreen
        title="Admin & Test Operasyon Merkezi"
        subtitle="Yetki ve oturum bilgileri doğrulanıyor..."
        badge="OTOBEYİNPAZARI YÖNETİM PANELİ"
      />
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-950 text-white">
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-3 min-w-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/assets/logo-square.jpg"
            alt="OtoBeyinPazari.com"
            className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 border border-white/15 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-sm tracking-tight text-white truncate">
              OtoBeyinPazari
            </p>
            <p className="text-[11px] font-medium text-orange-400 uppercase tracking-wider">
              Test &amp; Operasyon
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          aria-label="Menüyü kapat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operasyon Modülleri
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActiveLink(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-white" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-5 mt-5 border-t border-white/10 space-y-1.5">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hızlı Bağlantılar &amp; Yönetim Sunumları
          </p>
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Müşteri Vitrini</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/sunum"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>İş Modeli Sunumu</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/sunum-global"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Global Analiz Sunumu</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/sunum-yatirim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Cihaz &amp; Yatırım Sunumu</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/sunum-strateji"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>Stratejik Değerlendirme</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10 bg-navy-900/60 space-y-3">
        <PwaInstallButton
          label="Admin Uygulamasını Kur"
          appTitle="OtoBeyin Admin & Test Merkezi"
          variant="dark"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.fullName || user.email}
            </p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-rose-600/90 text-slate-200 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-68 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-navy-950 text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
          <img
            src="/assets/logo-square.jpg"
            alt="OtoBeyinPazari.com"
            className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 border border-white/15 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">
              OtoBeyinPazari
            </p>
            <p className="text-[10px] text-orange-400 font-medium uppercase tracking-wider">
              Admin &amp; Test Merkezi
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200">
            {ROLE_LABELS[user.role] || user.role}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
            aria-label="Menüyü aç"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
