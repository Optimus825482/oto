"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";
import {
  ExternalLink,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Menu,
  PackageCheck,
  UserCircle2,
  Wallet,
  X,
} from "lucide-react";

interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  supplierId?: string | null;
}

const NAV_ITEMS = [
  {
    href: "/tedarikci",
    label: "Gelen Talepler (RFQ)",
    icon: Inbox,
  },
  {
    href: "/tedarikci/siparisler",
    label: "Siparişler & Kargo",
    icon: PackageCheck,
  },
  {
    href: "/tedarikci/cari",
    label: "Cari Hesap & Hakediş",
    icon: Wallet,
  },
];

export default function SupplierShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!data?.user || data.user.role !== "SUPPLIER") {
          router.replace("/giris");
          return;
        }

        setUser(data.user);
        setCheckingAuth(false);
      } catch {
        if (!active) return;
        router.replace("/giris");
      }
    }

    verifySession();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/giris");
      router.refresh();
    }
  }

  if (checkingAuth) {
    return (
      <BrandLoadingScreen
        title="Tedarikçi Portalı (Kapalı Ağ)"
        subtitle="Tedarikçi oturumu doğrulanıyor..."
        badge="ONAYLI TEDARİKÇİ AĞI"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Masaüstü Sol Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-navy-900 text-white border-r border-navy-800">
        <div className="p-5 border-b border-white/10 space-y-4">
          <Link href="/tedarikci" className="flex items-center gap-3">
            <img
              src="/assets/logo-main.jpg"
              alt="OtoBeyinPazari.com"
              className="h-10 w-auto rounded-lg object-contain bg-white p-0.5"
            />
            <div>
              <span className="block text-sm font-bold text-white leading-tight">
                OtoBeyinPazari
              </span>
              <span className="block text-[11px] text-slate-300">
                Tedarikçi Portalı
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Lock className="w-3.5 h-3.5" />
            <span>Kapalı Tedarikçi Ağı</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <PwaInstallButton
            label="Tedarikçi Uygulamasını Kur"
            appTitle="OtoBeyin Tedarikçi Portalı"
            variant="dark"
          />
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
            <UserCircle2 className="w-8 h-8 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || "Onaylı Tedarikçi"}
              </p>
              <p className="text-xs text-slate-300 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Vitrin</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-200 transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Çıkılıyor" : "Çıkış Yap"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobil Üst Gezinme Çubuğu */}
      <header className="no-print lg:hidden sticky top-0 z-30 bg-navy-900 text-white border-b border-navy-800">
        <div className="px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/tedarikci" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/logo-main.jpg"
              alt="OtoBeyinPazari.com"
              className="h-9 w-auto rounded-lg object-contain bg-white p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-sm font-bold truncate">
                Tedarikçi Portalı
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                <Lock className="w-2.5 h-2.5" />
                Kapalı Tedarikçi Ağı
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Menüyü aç/kapat"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobil Hızlı Sekme Şeridi */}
        <div className="px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "bg-white/10 text-slate-200 hover:bg-white/15"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobil Açılır Hesap Menüsü */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-navy-950 px-4 py-3 space-y-3">
            <div className="flex items-center gap-2.5">
              <UserCircle2 className="w-7 h-7 text-orange-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName || "Onaylı Tedarikçi"}
                </p>
                <p className="text-xs text-slate-300 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Vitrin</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loggingOut ? "Çıkılıyor..." : "Çıkış Yap"}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 lg:pl-72 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
