"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Handshake,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

type DemoAccount = {
  label: string;
  sublabel: string;
  email: string;
  password: string;
  roleBadge: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Admin",
    sublabel: "Merkez Operasyon & Fiyatlandırma",
    email: "admin@otobeyinpazari.com",
    password: "Admin123!",
    roleBadge: "ADMIN",
  },
  {
    label: "Test Teknisyeni",
    sublabel: "Tezgâh & CAN-Bus Test Lab",
    email: "lab@otobeyinpazari.com",
    password: "Lab123!",
    roleBadge: "TECHNICIAN",
  },
  {
    label: "Tedarikçi #1 — Ankara Ostim",
    sublabel: "Ostim Oto Elektronik A.Ş.",
    email: "tedarikci1@otobeyinpazari.com",
    password: "Tedarik123!",
    roleBadge: "SUPPLIER",
  },
  {
    label: "Tedarikçi #2 — İstanbul İkitelli",
    sublabel: "İkitelli Beyin Merkezi",
    email: "tedarikci2@otobeyinpazari.com",
    password: "Tedarik123!",
    roleBadge: "SUPPLIER",
  },
];

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  function fillDemoCredentials(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(account.email);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.");
        setLoading(false);
        return;
      }

      const role: string | undefined = data?.user?.role;
      if (role === "ADMIN" || role === "OPERATOR" || role === "TECHNICIAN") {
        router.push("/admin");
      } else if (role === "SUPPLIER") {
        router.push("/tedarikci");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Sunucu ile bağlantı kurulamadı. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Üst Gezinme Çubuğu */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/assets/logo-main.jpg"
              alt="OtoBeyinPazari.com"
              className="h-10 w-auto rounded-lg object-contain border border-slate-100"
            />
            <div className="hidden sm:block">
              <span className="block text-sm font-bold text-navy-900 group-hover:text-orange-500 transition-colors">
                OtoBeyinPazari.com
              </span>
              <span className="block text-xs text-slate-500">
                Test Garantili Merkezi Tedarik Ağı
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Müşteri Vitrini</span>
            </Link>
            <Link
              href="/tedarikci-basvuru"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
            >
              <Handshake className="w-4 h-4 text-orange-400" />
              <span>Tedarikçi Başvurusu</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol: Giriş Formu */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-navy-900 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                      Kurumsal Portal Girişi
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Operasyon Merkezi, Test Lab & Onaylı Tedarikçi Ağı
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-navy-900"
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@otobeyinpazari.com"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-navy-900"
                >
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-4 shadow-sm transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Portala Giriş Yap</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Yetkili rolünüze göre otomatik yönlendirilirsiniz.</span>
                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="font-medium text-navy-900 hover:text-orange-500 transition-colors"
                  >
                    Müşteri Vitrini
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link
                    href="/tedarikci-basvuru"
                    className="font-medium text-navy-900 hover:text-orange-500 transition-colors"
                  >
                    Tedarikçi Başvurusu
                  </Link>
                </div>
              </div>
            </form>
          </section>

          {/* Sağ: Hızlı Demo Girişi Paneli */}
          <aside className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  Hızlı Demo Girişi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Test etmek istediğiniz rolü seçerek giriş formunu tek tıkla doldurun.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((account) => {
                const isSelected = selectedDemo === account.email;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoCredentials(account)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/70 ring-1 ring-orange-500/30"
                        : "border-slate-200 hover:border-navy-700/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>{account.label}</span>
                      </span>
                      <span className="inline-flex items-center rounded-md bg-navy-900/5 px-2 py-0.5 text-[10px] font-bold tracking-wide text-navy-900">
                        {account.roleBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {account.sublabel}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-500">
                      <span>{account.email}</span>
                      <span className="text-slate-300">/</span>
                      <span>{account.password}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 leading-relaxed">
              <strong className="text-navy-900">Not:</strong> Tedarikçi hesapları
              yalnızca <span className="font-semibold">Kapalı Tedarikçi Ağı</span>{" "}
              verilerini görür; müşteri iletişim bilgileri gizli tutulur.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
