"use client";

import React, { useState, useEffect } from "react";
import { StoredUser, UserIdentityInfo } from "@/lib/auth/userStorage";
import { apiLogin, apiRegister } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface UserLoginModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onLogin: (user: StoredUser) => void;
}

export default function UserLoginModal({
  isOpen,
  initialMode = "register",
  onClose,
  onLogin,
}: UserLoginModalProps) {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tcKimlik, setTcKimlik] = useState("");
  const [bloodType, setBloodType] = useState<UserIdentityInfo["bloodType"]>("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegister(initialMode === "register");
    }
  }, [isOpen, initialMode]);

  // Load remembered credentials from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medi_remember_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn("Error reading remembered credentials:", e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function normalizePhoneNumber(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+90${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return `+90${digits.slice(1)}`;
    }
    if (digits.length === 12 && digits.startsWith("90")) {
      return `+${digits}`;
    }
    return raw.trim();
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formattedPhone = normalizePhoneNumber(phone);

    if (!formattedPhone || !password.trim()) {
      setError("Lütfen telefon numaranızı ve şifrenizi giriniz.");
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError("Lütfen adınızı ve soyadınızı giriniz.");
        setLoading(false);
        return;
      }

      if (tcKimlik && tcKimlik.trim().length !== 11) {
        setError("T.C. Kimlik Numarası 11 haneli olmalıdır.");
        setLoading(false);
        return;
      }

      const initialIdentity: UserIdentityInfo = {
        tcKimlik: tcKimlik ? tcKimlik.trim() : "",
        bloodType: bloodType || "",
        isVerified: Boolean(tcKimlik && tcKimlik.trim().length === 11),
      };

      const res = await apiRegister(name, formattedPhone, password, email, initialIdentity);
      if (res.success && res.user) {
        // Save or clear remember me
        if (rememberMe) {
          localStorage.setItem(
            "medi_remember_user",
            JSON.stringify({ phone: phone.trim(), password: password.trim() })
          );
        } else {
          localStorage.removeItem("medi_remember_user");
        }

        onLogin(res.user);
        onClose();
      } else {
        setError(res.error || "Kayıt başarısız oldu.");
      }
    } else {
      const res = await apiLogin(formattedPhone, password);
      if (res.success && res.user) {
        // Save or clear remember me
        if (rememberMe) {
          localStorage.setItem(
            "medi_remember_user",
            JSON.stringify({ phone: phone.trim(), password: password.trim() })
          );
        } else {
          localStorage.removeItem("medi_remember_user");
        }

        onLogin(res.user);
        onClose();
      } else {
        setError(res.error || "Giriş başarısız. Telefon numarası veya şifre hatalı.");
      }
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 space-y-5 relative transition-colors max-h-[92vh] overflow-y-auto">
        {/* Header with Patient Theme */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 text-2xl font-bold">
            💊
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Medi<span className="text-emerald-600 dark:text-emerald-400">Remind</span> Hasta Portalı
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isRegister
              ? "Yeni hasta hesabı açarak ilaç hatırlatmalarınızı hemen başlatın."
              : "Kayıtlı telefon numaranız ve şifrenizle oturum açın."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              isRegister
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ✨ Yeni Kayıt Ol
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              !isRegister
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            👤 Giriş Yap
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Adınız Soyadınız <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* T.C. Kimlik No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  T.C. Kimlik Numarası (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, ""))}
                  placeholder="11 haneli T.C. Kimlik No"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Kan Grubu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kan Grubu (İsteğe Bağlı)
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Seçiniz</option>
                  <option value="A+">A Rh (+)</option>
                  <option value="A-">A Rh (-)</option>
                  <option value="B+">B Rh (+)</option>
                  <option value="B-">B Rh (-)</option>
                  <option value="AB+">AB Rh (+)</option>
                  <option value="AB-">AB Rh (-)</option>
                  <option value="0+">0 Rh (+)</option>
                  <option value="0-">0 Rh (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  E-posta Adresi (İsteğe Bağlı)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmet@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Telefon Numaranız <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX veya 5XX XXX XX XX"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Şifreniz <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Beni Hatırla Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Beni Hatırla (Otomatik Doldur)
              </span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all text-sm mt-2"
          >
            {loading
              ? "İşleniyor..."
              : isRegister
              ? "✨ Kayıt Ol ve Giriş Yap"
              : "👤 Şifre ile Giriş Yap"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isRegister
                ? "Zaten bir hesabınız var mı? Giriş Yapın →"
                : "Hesabınız yok mu? Hemen Yeni Kayıt Olun →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
