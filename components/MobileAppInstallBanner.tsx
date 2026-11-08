"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";

export default function MobileAppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone/installed mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If on iOS and not standalone, show banner after 2s
    if (isIosDevice && !standaloneMode) {
      const timer = setTimeout(() => {
        const dismissed = sessionStorage.getItem("medi_pwa_dismissed");
        if (!dismissed) setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      alert("Uygulamayı tarayıcınızın menüsünden 'Ana Ekrana Ekle' veya 'Uygulamayı Yükle' seçeneğiyle yükleyebilirsiniz.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] Install prompt outcome:", outcome);
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    setShowBanner(false);
    sessionStorage.setItem("medi_pwa_dismissed", "true");
  }

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Mobile App Install Card / Banner */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20 animate-fadeIn transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center text-2xl shadow-md shrink-0 font-bold">
              💊
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>MediRemind Mobil Uygulaması</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5 leading-snug">
                Telefonunuza yükleyin; internetsiz kullanım, sesli alarmlar ve anlık SMS bildirimlerine hızlıca erişin.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/15">
          <button
            onClick={handleDismiss}
            className="text-xs text-emerald-100 hover:text-white font-medium px-2 py-1"
          >
            Daha Sonra
          </button>

          <Button
            onClick={handleInstallClick}
            size="sm"
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-black text-xs px-4 h-9 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>📲</span>
            <span>Uygulamayı Yükle</span>
          </Button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-2xl flex items-center justify-center">
              📲
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              iPhone / iPad'e Yükleme
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 text-left space-y-2.5 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <span>Safari tarayıcısının altındaki <strong>Paylaş (Share ⎋)</strong> butonuna dokunun.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <span>Aşağı kaydırıp <strong>"Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğini seçin.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <span>Sağ üstteki <strong>"Ekle"</strong> butonuna dokunun.</span>
              </p>
            </div>
            <Button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10"
            >
              Anladım
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
