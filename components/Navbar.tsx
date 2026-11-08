"use client";

import React, { useEffect, useState } from "react";
import { StoredUser } from "@/lib/auth/userStorage";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  currentUser: StoredUser | null;
  smsMode: string;
  provider: string;
  onQuickTest: () => void;
  testing: boolean;
  onLogout: () => void;
  onOpenUserLogin: (mode?: "login" | "register") => void;
}

export default function Navbar({
  currentUser,
  smsMode,
  provider,
  onQuickTest,
  testing,
  onLogout,
  onOpenUserLogin,
}: NavbarProps) {
  const [time, setTime] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert("📲 MediRemind Mobil Uygulaması: Tarayıcınızın menüsünden 'Ana Ekrana Ekle' veya 'Uygulamayı Yükle' seçeneğiyle doğrudan telefonunuza indirebilirsiniz.");
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo, Title & Mobile App Button (Logonun Yanında) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-3xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 text-xl sm:text-2xl font-bold shrink-0">
              💊
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white tracking-tight text-lg sm:text-xl">
                  Medi<span className="text-primary">Remind</span>
                </span>
                {currentUser && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    HASTA
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
                Akıllı İlaç & SMS Mobil Uygulaması
              </p>
            </div>

            {/* 📲 UYGULAMA LİNKİ (LOGONUN YANINDA SABİT) */}
            <button
              type="button"
              onClick={handleInstallApp}
              title="MediRemind Mobil Uygulamasını Telefona / Cihaza Yükle"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-black transition-all active:scale-95 ml-2"
            >
              <span className="text-sm">📲</span>
              <span>Uygulama Yükle</span>
            </button>
          </div>

          {/* Right Navigation & User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Real-time Clock (Desktop) */}
            {time && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium">
                <span className="text-slate-400">🕒</span>
                {time}
              </div>
            )}

            {/* Dark/Light Mode Switcher */}
            <ThemeToggle />

            {/* If Logged In: Show Profile & Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right pr-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {currentUser.phone}
                  </span>
                </div>

                <Button
                  onClick={onLogout}
                  size="sm"
                  variant="destructive"
                  className="h-9 sm:h-10 px-3 text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  Çıkış
                </Button>
              </div>
            ) : (
              /* If Not Logged In: Kayıt Ol and Giriş Yap Buttons */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  onClick={() => onOpenUserLogin("register")}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 h-10 rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center gap-1"
                >
                  <span>✨</span>
                  <span>Kayıt Ol</span>
                </Button>

                <Button
                  onClick={() => onOpenUserLogin("login")}
                  size="sm"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs px-3 sm:px-3.5 h-9 sm:h-10 rounded-xl transition-all"
                >
                  <span>Giriş</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
