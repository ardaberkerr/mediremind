"use client";

import React, { useState } from "react";
import { User, INITIAL_USERS } from "@/lib/auth/users";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  onLogin: (user: User) => void;
}

export default function AuthModal({ onLogin }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanInput = phone.trim().toLowerCase();
    
    // Find matching user
    const found = INITIAL_USERS.find(
      (u) =>
        u.phone.replace(/\D/g, "").slice(-10) === cleanInput.replace(/\D/g, "").slice(-10) ||
        u.name.toLowerCase().includes(cleanInput) ||
        (cleanInput === "admin" && u.role === "admin")
    );

    if (found) {
      onLogin(found);
    } else {
      if (isRegister) {
        if (!name || !phone) {
          setError("Lütfen isim ve telefon numaranızı eksiksiz giriniz.");
          return;
        }
        const newUser: User = {
          id: `user_${Date.now()}`,
          name,
          phone,
          role: "user",
        };
        onLogin(newUser);
      } else {
        setError("Kullanıcı bulunamadı. Lütfen telefon numaranızı kontrol edin veya hızlı giriş butonlarını kullanın.");
      }
    }
  }

  function handleQuickLogin(user: User) {
    onLogin(user);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-6 animate-fadeIn">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 text-2xl font-bold">
            💊
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Medi<span className="text-emerald-600">Remind</span> Giriş
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {isRegister
              ? "Yeni hasta hesabı oluşturun ve SMS hatırlatmalarını başlatın."
              : "Lütfen devam etmek için giriş yapın veya demo hesabını seçin."}
          </p>
        </div>

        {/* Quick Demo One-Click Login Section */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            ⚡ Tek Tıkla Hızlı Giriş (Demo Hesaplar)
          </span>

          <div className="grid grid-cols-1 gap-2">
            {/* Admin Login */}
            <button
              onClick={() => handleQuickLogin(INITIAL_USERS[0])}
              className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">
                    Yönetici (Admin) Girişi
                  </h4>
                  <p className="text-[11px] text-emerald-600">Tüm kullanıcıların SMS'leri, arama & sağlayıcı paneli</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">Giriş →</span>
            </button>

            {/* Patient 1 */}
            <button
              onClick={() => handleQuickLogin(INITIAL_USERS[1])}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                    Ahmet Yılmaz (Hasta)
                  </h4>
                  <p className="text-[11px] text-slate-500">Tel: +90 555 123 45 67 (Sadece kendi SMS'leri)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">Giriş →</span>
            </button>

            {/* Patient 2 */}
            <button
              onClick={() => handleQuickLogin(INITIAL_USERS[2])}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                    Ayşe Demir (Hasta)
                  </h4>
                  <p className="text-[11px] text-slate-500">Tel: +90 551 172 11 55 (Sadece kendi SMS'leri)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">Giriş →</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold uppercase">veya telefonla gir</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Zeynep Kaya"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Telefon Numarası veya Kullanıcı Adı
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Örn: +905551234567 veya admin"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Şifre (İsteğe Bağlı)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20"
          >
            {isRegister ? "Kayıt Ol ve Giriş Yap" : "Giriş Yap"}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              {isRegister
                ? "Zaten bir hesabınız var mı? Giriş yapın"
                : "Yeni kullanıcı mısınız? Hesap oluşturun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
