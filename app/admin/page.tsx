"use client";

import React, { useEffect, useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginModal from "@/components/AdminLoginModal";
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
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface ActiveSmsAlert {
  to: string;
  message: string;
  provider: string;
  time: string;
}

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState<StoredUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(true);
  
  const [smsStatus, setSmsStatus] = useState<{
    status?: string;
    provider?: string;
    mode?: string;
  }>({ mode: "demo", provider: "demo" });

  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [incomingSmsAlert, setIncomingSmsAlert] = useState<ActiveSmsAlert | null>(null);

  async function loadLogs() {
    const serverLogs = await fetchSmsLogs(undefined, "admin");
    setLogs(serverLogs);
  }

  useEffect(() => {
    const sessionAdmin = sessionStorage.getItem("medi_active_admin");
    if (sessionAdmin) {
      try {
        const u = JSON.parse(sessionAdmin);
        if (u.role === "admin" || u.permissions?.canAccessAdminPanel) {
          setAdminUser(u);
          setShowLoginModal(false);
        }
      } catch {}
    }

    getSmsStatus().then((data) => {
      if (data) setSmsStatus(data);
    });
    loadLogs();

    // Auto-polling for real-time live SMS logs
    const interval = setInterval(loadLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  function triggerSmsAlert(to: string, message: string, provider: string = "demo") {
    // Sabit Bildirim (Zıplama Yok)
    setIncomingSmsAlert({
      to,
      message,
      provider,
      time: new Date().toLocaleTimeString("tr-TR"),
    });

    playNotificationChime();

    showDesktopNotification(
      "📱 Yeni SMS Bildirimi (Admin)",
      `Alıcı: ${to}\nİçerik: ${message}`
    );
  }

  function handleLogin(u: StoredUser) {
    if (u.role === "admin" || u.permissions?.canAccessAdminPanel) {
      setAdminUser(u);
      sessionStorage.setItem("medi_active_admin", JSON.stringify(u));
      setShowLoginModal(false);
      loadLogs();
    } else {
      alert("Bu alana yalnızca yetkili Admin kullanıcıları erişebilir.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("medi_active_admin");
    setAdminUser(null);
    setShowLoginModal(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Admin Dedicated Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-900/60 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 text-2xl font-bold">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white tracking-tight text-xl">
                    Medi<span className="text-emerald-400">Remind</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ADMIN PORTALI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Sistem Yönetimi & Denetim Merkezi</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />

              {adminUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 font-bold hidden md:inline">
                    {adminUser.name}
                  </span>
                  <Button
                    onClick={handleLogout}
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 text-xs font-bold rounded-xl h-9"
                  >
                    Çıkış Yap
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl h-9 shadow-md shadow-emerald-600/30"
                >
                  Admin Girişi
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showLoginModal && !adminUser}
        onClose={() => {
          if (adminUser) setShowLoginModal(false);
        }}
        onLogin={handleLogin}
      />

      {/* 📱 Canlı Demo SMS Gelen Kutusu Pop-up (Sabit - Zıplama Yok) */}
      {incomingSmsAlert && (
        <div className="fixed bottom-5 right-5 sm:top-24 sm:right-6 z-50 max-w-sm sm:max-w-md w-full shadow-2xl rounded-3xl bg-slate-900 border border-emerald-500/50 text-white p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center text-lg">
                📱
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-emerald-400 uppercase tracking-wide">
                  Gelen SMS Bildirimi
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="uppercase font-semibold text-emerald-400">[{incomingSmsAlert.provider}]</span>
                  <span>•</span>
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
            <div className="bg-slate-950 p-3 rounded-xl text-slate-100 border border-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition-all"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!adminUser ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl border border-emerald-500/30">
              🔒
            </div>
            <h2 className="text-2xl font-black text-white">Yönetici Girişi Gereklidir</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Bu panel yalnızca yetkili sistem yöneticileri içindir. Lütfen şifrenizle giriş yapın.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                Şifre ile Giriş Yap
              </Button>
            </div>
          </div>
        ) : (
          <AdminDashboard
            adminUser={adminUser}
            logs={logs}
            smsStatus={smsStatus}
            onRefreshLogs={loadLogs}
            onSmsTriggered={triggerSmsAlert}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediRemind Admin Denetim Portalı © {new Date().getFullYear()}</span>
          <span className="text-[11px] text-emerald-400 font-mono">Yetkili Erişim</span>
        </div>
      </footer>
    </div>
  );
}
