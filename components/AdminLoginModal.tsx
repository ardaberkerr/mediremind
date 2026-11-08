"use client";

import React, { useState } from "react";
import { StoredUser } from "@/lib/auth/userStorage";
import { apiLogin } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: StoredUser) => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLogin,
}: AdminLoginModalProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function normalizePhoneNumber(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.toLowerCase() === "admin") return trimmed;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+90${digits}`;
    if (digits.length === 11 && digits.startsWith("0")) return `+90${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("90")) return `+${digits}`;
    return trimmed;
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formattedUsername = normalizePhoneNumber(username);

    if (!formattedUsername || !password.trim()) {
      setError("Lütfen yönetici kullanıcı adınızı ve şifrenizi giriniz.");
      setLoading(false);
      return;
    }

    const res = await apiLogin(formattedUsername, password.trim());
    if (res.success && res.user) {
      if (res.user.role === "admin" || res.user.permissions?.canAccessAdminPanel) {
        onLogin(res.user);
        onClose();
      } else {
        setError("Bu hesabın Admin Paneline erişim yetkisi bulunmamaktadır.");
      }
    } else {
      setError(res.error || "Hatalı yönetici bilgileri! Lütfen şifrenizi kontrol ediniz.");
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-emerald-500/30 max-w-md w-full p-6 sm:p-8 space-y-6 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all"
        >
          ✕
        </button>

        {/* Header with Security Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 text-2xl font-bold">
            🛡️
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            Yetkili Yönetici Girişi
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Sistem Yönetimi (Admin) Girişi
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Lütfen yönetici şifrenizi girerek yetkilendirme ve denetim merkezine erişin.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Kullanıcı Adı veya Telefon
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin veya 05XX XXX XX XX"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Yönetici Şifresi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
          >
            {loading ? "Doğrulanıyor..." : "Şifre ile Giriş Yap"}
          </Button>
        </form>
      </div>
    </div>
  );
}
