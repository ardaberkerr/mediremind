"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import UserLoginModal from "@/components/UserLoginModal";
import UserDashboard from "@/components/UserDashboard";
import MobileAppInstallBanner from "@/components/MobileAppInstallBanner";
import { StoredUser } from "@/lib/auth/userStorage";
import {
  getSmsStatus,
  sendTestSms,
  fetchSmsLogs,
  playNotificationChime,
  showDesktopNotification,
  SmsLogItem,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface ActiveSmsAlert {
  to: string;
  message: string;
  provider: string;
  time: string;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "register">("register");

  const [smsStatus, setSmsStatus] = useState<{
    status?: string;
    provider?: string;
    mode?: string;
  }>({ mode: "demo", provider: "demo" });

  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [incomingSmsAlert, setIncomingSmsAlert] = useState<ActiveSmsAlert | null>(null);
  const [activeMedicationDetail, setActiveMedicationDetail] = useState<{
    name: string;
    dosage: string;
    time: string;
    notes?: string;
  } | null>(null);

  // Parse URL search params if opened from a notification click
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const medName = params.get("medName");
    if (medName) {
      setActiveMedicationDetail({
        name: medName,
        dosage: params.get("medDosage") || "",
        time: params.get("medTime") || "",
        notes: params.get("medNotes") || "",
      });
      // Play reminder chime when opened
      playNotificationChime();
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function loadLogs() {
    if (!currentUser) return;
    const serverLogs = await fetchSmsLogs(currentUser.phone, "user");
    setLogs(serverLogs);
  }

  // On mount, verify active patient session or open register/login
  useEffect(() => {
    const sessionUser = sessionStorage.getItem("medi_active_patient");
    if (sessionUser) {
      try {
        const u = JSON.parse(sessionUser);
        if (u.role === "user" || u.role === "patient" || u.id) {
          setCurrentUser(u);
        } else {
          setShowUserLogin(true);
        }
      } catch {
        setShowUserLogin(true);
      }
    } else {
      setShowUserLogin(true);
    }

    getSmsStatus().then((data) => {
      if (data) setSmsStatus(data);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadLogs();
      sessionStorage.setItem("medi_active_patient", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  function triggerSmsAlert(to: string, message: string, provider: string = "demo") {
    // Sabit Pop-up Bildirim (Zıplama Yok)
    setIncomingSmsAlert({
      to,
      message,
      provider,
      time: new Date().toLocaleTimeString("tr-TR"),
    });

    playNotificationChime();

    showDesktopNotification(
      "📱 Yeni SMS Bildirimi",
      `Alıcı: ${to}\nİçerik: ${message}`
    );
  }

  async function handleQuickTest() {
    if (!currentUser) return;
    setTesting(true);
    try {
      const res = await sendTestSms();
      triggerSmsAlert(
        currentUser.phone,
        "❤️ İlaç Hatırlatma: Aspirin (500 mg) alma zamanınız geldi!\nÖnemli: Yemeklerden sonra aliniz.",
        res.activeProvider || "demo"
      );
      await loadLogs();
    } catch (err: any) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  }

  function handleOpenLogin(mode: "login" | "register" = "register") {
    setLoginModalMode(mode);
    setShowUserLogin(true);
  }

  function handleLogin(user: StoredUser) {
    setCurrentUser(user);
    setShowUserLogin(false);
  }

  function handleLogout() {
    sessionStorage.removeItem("medi_active_patient");
    setCurrentUser(null);
    setLoginModalMode("login");
    setShowUserLogin(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Patient Navbar with App Link beside logo */}
      <Navbar
        currentUser={currentUser}
        smsMode={smsStatus.mode || "demo"}
        provider={smsStatus.provider || "demo"}
        onQuickTest={handleQuickTest}
        testing={testing}
        onLogout={handleLogout}
        onOpenUserLogin={handleOpenLogin}
      />

      {/* Patient Login & Register Modal */}
      <UserLoginModal
        isOpen={showUserLogin && !currentUser}
        initialMode={loginModalMode}
        onClose={() => {
          if (currentUser) setShowUserLogin(false);
        }}
        onLogin={handleLogin}
      />

      {/* Mobile App Install Banner / PWA Prompt */}
      <MobileAppInstallBanner />

      {/* 📱 Sabit Pop-up Bildirim */}
      {incomingSmsAlert && (
        <div className="fixed bottom-20 sm:bottom-5 right-5 sm:top-24 sm:right-6 z-50 max-w-sm sm:max-w-md w-full shadow-2xl rounded-3xl bg-slate-900 border border-slate-700 text-white p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-lg">
                📱
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-emerald-300 uppercase tracking-wide">
                  Gelen SMS Bildirimi
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{incomingSmsAlert.time}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIncomingSmsAlert(null)}
              className="text-slate-400 hover:text-white bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="text-slate-300 flex items-center justify-between">
              <span>
                <strong className="text-slate-400">Alıcı:</strong> {incomingSmsAlert.to}
              </span>
              <span className="text-[11px] text-slate-500">Şimdi</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl text-slate-100 border border-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
              {incomingSmsAlert.message}
            </div>
          </div>

          <div className="mt-3.5 flex justify-between items-center text-[11px] sm:text-xs">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Teslim Edildi
            </span>
            <button
              onClick={() => setIncomingSmsAlert(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* İlaç Detay Pop-up (Bildirime tıklandığında açılır) */}
      {activeMedicationDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-emerald-500/40 space-y-5 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
                  💊
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    İLAÇ VAKTİ GELDİ
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {activeMedicationDetail.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveMedicationDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kullanım Dozu:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeMedicationDetail.dosage}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hatırlatma Saati:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{activeMedicationDetail.time}</span>
              </div>
              {activeMedicationDetail.notes && (
                <div className="pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Kullanım Notu:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    "{activeMedicationDetail.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={async () => {
                  try {
                    await fetch("/api/medications/history", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: currentUser?.id || "guest",
                        medicationName: activeMedicationDetail.name,
                        dosage: activeMedicationDetail.dosage,
                        scheduledTime: activeMedicationDetail.time,
                        action: "taken",
                        notes: activeMedicationDetail.notes,
                      }),
                    });
                  } catch {}
                  alert(`✅ Harika! ${activeMedicationDetail.name} ilacınızı aldığınız kaydedildi.`);
                  setActiveMedicationDetail(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md shadow-emerald-600/30 text-sm"
              >
                ✓ İlacımı Aldım
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await fetch("/api/medications/history", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: currentUser?.id || "guest",
                        medicationName: activeMedicationDetail.name,
                        dosage: activeMedicationDetail.dosage,
                        scheduledTime: activeMedicationDetail.time,
                        action: "skipped",
                        notes: "Kullanıcı atladı/kapattı",
                      }),
                    });
                  } catch {}
                  setActiveMedicationDetail(null);
                }}
                className="border-slate-300 dark:border-slate-700 font-bold h-11 rounded-xl text-sm"
              >
                Atla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Patient Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!currentUser ? (
          <div className="py-16 text-center space-y-5 max-w-md mx-auto animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-3xl shadow-sm">
              💊
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Akıllı İlaç Hatırlatıcı & Takip
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              İlaç saatlerinizi kaçırmayın! Telefonunuza otomatik SMS hatırlatmaları ve sesli alarmlar almak için hesabınızı oluşturun veya giriş yapın.
            </p>

            <div className="space-y-2.5 pt-2">
              <Button
                onClick={() => handleOpenLogin("register")}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-11 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm"
              >
                ✨ Yeni Hasta Kaydı Oluştur
              </Button>

              <Button
                onClick={() => handleOpenLogin("login")}
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold h-11 rounded-xl text-sm"
              >
                👤 Mevcut Hesapla Giriş Yap
              </Button>
            </div>
          </div>
        ) : (
          <UserDashboard
            user={currentUser}
            logs={logs}
            onRefreshLogs={loadLogs}
            onSmsTriggered={triggerSmsAlert}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}
      </main>

      {/* Clean Patient Footer (No Admin Links) */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-5 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>MediRemind © {new Date().getFullYear()} — Akıllı İlaç Hatırlatma & Mobil SMS Servisi</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Aktif Hasta: <strong className="text-emerald-700 dark:text-emerald-300">{currentUser?.name || "Giriş Yapılmadı"}</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
