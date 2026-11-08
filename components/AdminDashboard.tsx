"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StoredUser } from "@/lib/auth/userStorage";
import {
  SmsLogItem,
  sendSms,
  sendTestSms,
  clearAllSmsLogs,
  apiFetchAllUsers,
  apiUpdateUser,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
  adminUser: StoredUser;
  logs: SmsLogItem[];
  smsStatus: { status?: string; provider?: string; mode?: string };
  onRefreshLogs: () => void;
  onSmsTriggered: (to: string, message: string, provider: string) => void;
}

export default function AdminDashboard({
  adminUser,
  logs,
  smsStatus,
  onRefreshLogs,
  onSmsTriggered,
}: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<"logs" | "users">("logs");

  // Granular Separate Filters
  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterMedName, setFilterMedName] = useState("");
  const [filterDosage, setFilterDosage] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Users State
  const [usersList, setUsersList] = useState<StoredUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Custom SMS State
  const [targetPhone, setTargetPhone] = useState("+905551234567");
  const [customText, setCustomText] = useState("Sayın hastamız, ilaç kontrolünüz için randevunuz bulunmaktadır.");
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick Test State
  const [testing, setTesting] = useState(false);

  // Real-time live polling every 2.5 seconds to instantly reflect any SMS
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshLogs();
    }, 2500);
    return () => clearInterval(interval);
  }, [onRefreshLogs]);

  async function loadAllUsers() {
    const fetched = await apiFetchAllUsers();
    setUsersList(fetched);
  }

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Map user phone -> user name
  const userPhoneToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    usersList.forEach((u) => {
      const clean = u.phone.replace(/\D/g, "").slice(-10);
      if (clean) map.set(clean, u.name);
    });
    return map;
  }, [usersList]);

  // Enriched logs with resolved name, medName, dosage
  const enrichedLogs = useMemo(() => {
    return logs.map((log) => {
      const cleanPhone = (log.to || "").replace(/\D/g, "").slice(-10);
      const resolvedName = log.userName || userPhoneToNameMap.get(cleanPhone) || "Kayıtsız Hasta";

      let medName = log.medicationName || "";
      let dosage = log.dosage || "";

      if (!medName || !dosage) {
        const match = log.message.match(/İlaç Hatırlatma:\s*([^(]+)\s*\(([^)]+)\)/i);
        if (match) {
          if (!medName) medName = match[1].trim();
          if (!dosage) dosage = match[2].trim();
        }
      }

      return {
        ...log,
        resolvedName,
        resolvedMedName: medName,
        resolvedDosage: dosage,
      };
    });
  }, [logs, userPhoneToNameMap]);

  // Separate Filter Logic
  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      // 1. İsim Filtresi
      if (filterName.trim()) {
        const qName = filterName.trim().toLowerCase();
        if (!log.resolvedName.toLowerCase().includes(qName)) {
          return false;
        }
      }

      // 2. Telefon Filtresi
      if (filterPhone.trim()) {
        const qPhone = filterPhone.trim().replace(/\D/g, "");
        const cleanTo = log.to.replace(/\D/g, "");
        if (!cleanTo.includes(qPhone)) {
          return false;
        }
      }

      // 3. İlaç Adı Filtresi
      if (filterMedName.trim()) {
        const qMed = filterMedName.trim().toLowerCase();
        const hasInMed = log.resolvedMedName.toLowerCase().includes(qMed);
        const hasInMsg = log.message.toLowerCase().includes(qMed);
        if (!hasInMed && !hasInMsg) {
          return false;
        }
      }

      // 4. Dozaj Filtresi
      if (filterDosage.trim()) {
        const qDoz = filterDosage.trim().toLowerCase();
        const hasInDoz = log.resolvedDosage.toLowerCase().includes(qDoz);
        const hasInMsg = log.message.toLowerCase().includes(qDoz);
        if (!hasInDoz && !hasInMsg) {
          return false;
        }
      }

      // 5. Sağlayıcı Filtresi
      if (selectedProvider !== "all") {
        if (log.provider.toLowerCase() !== selectedProvider.toLowerCase()) {
          return false;
        }
      }

      // 6. Durum Filtresi
      if (selectedStatus !== "all") {
        if (log.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [
    enrichedLogs,
    filterName,
    filterPhone,
    filterMedName,
    filterDosage,
    selectedProvider,
    selectedStatus,
  ]);

  const hasActiveFilters = Boolean(
    filterName.trim() ||
      filterPhone.trim() ||
      filterMedName.trim() ||
      filterDosage.trim() ||
      selectedProvider !== "all" ||
      selectedStatus !== "all"
  );

  function handleResetFilters() {
    setFilterName("");
    setFilterPhone("");
    setFilterMedName("");
    setFilterDosage("");
    setSelectedProvider("all");
    setSelectedStatus("all");
  }

  // Filtered Users (supports Name, Phone, Email, TC Kimlik)
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return usersList;

    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.identityInfo?.tcKimlik || "").includes(q) ||
        (u.identityInfo?.bloodType || "").toLowerCase().includes(q) ||
        (u.identityInfo?.chronicDiseases || "").toLowerCase().includes(q)
    );
  }, [usersList, userSearch]);

  async function handleQuickTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestSms();
      setTestResult({
        text: `✅ Test SMS gönderildi! Sağlayıcı: ${(res.activeProvider || "demo").toUpperCase()}`,
        type: "success",
      });
      onSmsTriggered(
        "+905551234567",
        "❤️ İlaç Hatırlatma: Aspirin (500 mg) alma zamanınız geldi!\nÖnemli: Yemeklerden sonra aliniz.",
        res.activeProvider || "demo"
      );
      onRefreshLogs();
    } catch (err: any) {
      setTestResult({ text: `❌ Test başarısız: ${err.message}`, type: "error" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSendCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPhone || !customText) return;
    setSending(true);
    try {
      const res = await sendSms({ to: targetPhone, message: customText });
      setTestResult({
        text: `✅ SMS başarıyla iletildi! Alıcı: ${targetPhone} (Mesaj ID: ${res.messageId || "N/A"})`,
        type: "success",
      });
      onSmsTriggered(targetPhone, customText, res.provider || "demo");
      onRefreshLogs();
      setCustomText("");
    } catch (err: any) {
      setTestResult({ text: `❌ İletim hatası: ${err.message}`, type: "error" });
    } finally {
      setSending(false);
    }
  }

  async function handleClearLogs() {
    if (confirm("Tüm SMS loglarını kalıcı olarak silmek istediğinizden emin misiniz?")) {
      await clearAllSmsLogs();
      onRefreshLogs();
    }
  }

  async function handleTogglePermission(userId: string, key: keyof StoredUser["permissions"]) {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;

    setUpdatingUserId(userId);
    const newPermissions = {
      ...target.permissions,
      [key]: !target.permissions[key],
    };

    const res = await apiUpdateUser(userId, { permissions: newPermissions });
    if (res.success && res.user) {
      setUsersList((prev) => prev.map((u) => (u.id === userId ? res.user! : u)));
    }
    setUpdatingUserId(null);
  }

  async function handleRoleChange(userId: string, newRole: "admin" | "moderator" | "user") {
    setUpdatingUserId(userId);
    const res = await apiUpdateUser(userId, { role: newRole });
    if (res.success && res.user) {
      setUsersList((prev) => prev.map((u) => (u.id === userId ? res.user! : u)));
    }
    setUpdatingUserId(null);
  }

  async function handleToggleSuspend(userId: string) {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;

    setUpdatingUserId(userId);
    const res = await apiUpdateUser(userId, { isSuspended: !target.isSuspended });
    if (res.success && res.user) {
      setUsersList((prev) => prev.map((u) => (u.id === userId ? res.user! : u)));
    }
    setUpdatingUserId(null);
  }

  return (
    <div className="space-y-6">
      {/* Admin Hero / System Health Banner */}
      <section className="rounded-3xl border border-emerald-900/60 dark:border-emerald-950 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-600 text-white tracking-wider shadow-sm">
                🛡️ Sistem Yönetim Portalı
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                🟢 Canlı Takip Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              SMS İletim & Hasta Kimlik Denetim Merkezi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Tüm hastaların SMS kayıtları ve T.C. Kimlik / Medikal bilgileri bu ekrandan anlık denetlenir.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Toplam SMS
              </span>
              <span className="text-xl sm:text-2xl font-black text-white">{logs.length}</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Aktif Sağlayıcı
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 uppercase">
                {smsStatus.provider || "DEMO"}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kayıtlı Hasta
              </span>
              <span className="text-xl sm:text-2xl font-black text-sky-300">
                {usersList.length} Kişi
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Çalışma Modu
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 uppercase">
                {smsStatus.mode || "DEMO"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs between SMS Logs and User Management */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveAdminTab("logs")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeAdminTab === "logs"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📋 SMS Logları & Canlı Denetim ({logs.length})
          </button>

          <button
            onClick={() => setActiveAdminTab("users")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeAdminTab === "users"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            👥 Hasta Kimlik & Yetki Yönetimi ({usersList.length})
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
              testResult.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-200"
                : "bg-rose-950/80 border-rose-500/60 text-rose-200"
            }`}
          >
            <span>{testResult.text}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* TAB 1: SMS LOGLARI & CANLI DENETİM */}
      {activeAdminTab === "logs" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Header Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Giden & Gelen SMS Log Akışı
                </h2>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Anlık Güncelleniyor
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem üzerinden hastalara iletilen tüm SMS kayıtları.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleQuickTest}
                disabled={testing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 px-4 rounded-xl shadow-md shadow-emerald-600/20"
              >
                {testing ? "Gönderiliyor..." : "⚡ Hızlı Demo Test SMS"}
              </Button>

              <Button
                onClick={handleClearLogs}
                variant="outline"
                className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold h-10 px-4 rounded-xl"
              >
                🗑️ Logları Temizle
              </Button>
            </div>
          </div>

          {/* 🔍 AYRI AYRI GELİŞMİŞ FİLTRELEME ALANI */}
          <div className="rounded-3xl border border-emerald-100 dark:border-emerald-950/60 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔎</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Detaylı Filtreleme Paneli
                </h3>
                {hasActiveFilters && (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    Aktif Filtre
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Gösterilen: <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length}</strong> / {logs.length} SMS
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <span>✕</span>
                    <span>Filtreleri Sıfırla</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Ana Arama Filtresi (İsim, Telefon, İlaç Adı, Doz) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Hasta İsmi */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  👤 Hasta İsmi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Örn: Ahmet, Ayşe..."
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">👤</span>
                  {filterName && (
                    <button
                      onClick={() => setFilterName("")}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Hasta Telefon Numarası */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  📞 Telefon Numarası
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                    placeholder="Örn: 5551234567..."
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">📞</span>
                  {filterPhone && (
                    <button
                      onClick={() => setFilterPhone("")}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 3. İlaç Adı */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  💊 İlaç Adı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterMedName}
                    onChange={(e) => setFilterMedName(e.target.value)}
                    placeholder="Örn: Aspirin, Parol..."
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">💊</span>
                  {filterMedName && (
                    <button
                      onClick={() => setFilterMedName("")}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Alınan Doz */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  ⚖️ Alınan Doz / Miktar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterDosage}
                    onChange={(e) => setFilterDosage(e.target.value)}
                    placeholder="Örn: 500 mg, 1 tablet..."
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">⚖️</span>
                  {filterDosage && (
                    <button
                      onClick={() => setFilterDosage("")}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* İkincil Filtreler (Sağlayıcı + Durum) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">📡 Sağlayıcı:</span>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">Tüm Sağlayıcılar</option>
                  <option value="demo">DEMO Mod</option>
                  <option value="netgsm">NETGSM</option>
                  <option value="twilio">TWILIO</option>
                  <option value="iltek">ILKTEK</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">🚦 Durum:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="success">✅ Başarılı</option>
                  <option value="failed">❌ Başarısız</option>
                </select>
              </div>
            </div>
          </div>

          {/* SMS Logları Tablosu */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            {filteredLogs.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-3xl">
                  📭
                </div>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {logs.length === 0 ? "Henüz kayıtlı SMS bulunmuyor." : "Arama kriterlerine uygun SMS bulunamadı."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-4">Zaman</th>
                      <th className="p-4">Hasta Adı</th>
                      <th className="p-4">Telefon</th>
                      <th className="p-4">İlaç & Doz</th>
                      <th className="p-4">Mesaj İçeriği</th>
                      <th className="p-4">Sağlayıcı</th>
                      <th className="p-4">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {log.resolvedName}
                        </td>
                        <td className="p-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {log.to}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {log.resolvedMedName ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                💊 {log.resolvedMedName}
                              </span>
                              {log.resolvedDosage && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {log.resolvedDosage}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Genel SMS</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 max-w-xs sm:max-w-md truncate">
                          <span title={log.message}>{log.message}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="uppercase font-bold text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {log.provider}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              İletildi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Hata
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Anlık SMS Gönderici (Admin) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>✉️</span>
                <span>Anlık Özel SMS Gönderici (Admin)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dilediğiniz hastaya doğrudan özel SMS iletebilirsiniz.
              </p>
            </div>

            <form onSubmit={handleSendCustom} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Alıcı Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+905551234567"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Hazır Hasta Şablonu
                  </label>
                  <select
                    onChange={(e) => setTargetPhone(e.target.value)}
                    value={targetPhone}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.phone}>
                        {u.name} ({u.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mesaj İçeriği
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  placeholder="Mesaj metnini buraya yazın..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {sending ? "İletiliyor..." : "Mesajı İlet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: HASTA KİMLİK & YETKİ YÖNETİMİ */}
      {activeAdminTab === "users" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Search */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Hasta Kimlik Bilgileri & Granüler Yetki Yönetimi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistemdeki tüm kayıtlı hastaların T.C. Kimlik, sağlık verileri, şifreleri ve yetki kısıtlamaları.
              </p>
            </div>

            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="İsim, telefon, TC No veya kan grubu ara..."
                className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredUsers.map((u) => {
              const isUpdating = updatingUserId === u.id;
              const hasTc = Boolean(u.identityInfo?.tcKimlik);

              return (
                <div
                  key={u.id}
                  className={`p-6 rounded-3xl border transition-all space-y-4 ${
                    u.isSuspended
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                      : u.role === "admin"
                      ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* User Profile Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                          u.role === "admin"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                            : "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                        }`}
                      >
                        {u.role === "admin" ? "🛡️" : "👤"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</h3>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              u.role === "admin"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{u.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleSuspend(u.id)}
                        disabled={isUpdating}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          u.isSuspended
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                        }`}
                      >
                        {u.isSuspended ? "Donduruldu" : "Dondur"}
                      </button>
                    </div>
                  </div>

                  {/* 🆔 HASTA KİMLİK & SAĞLIK DETAYLARI (ADMİN İNCELEME) */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/90 border border-emerald-100 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-700 pb-1.5">
                      <span className="font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <span>🆔</span>
                        <span>Resmi Kimlik & Sağlık Kaydı</span>
                      </span>
                      {hasTc ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Doğrulandı
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          ⚠️ Kimlik Eksik
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block">T.C. Kimlik No:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {u.identityInfo?.tcKimlik || "(Girilmedi)"}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block">Kan Grubu:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-bold">
                          {u.identityInfo?.bloodType ? `${u.identityInfo.bloodType} Rh` : "(Belirtilmedi)"}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block">Doğum Tarihi:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {u.identityInfo?.birthDate || "(Belirtilmedi)"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block">Cinsiyet:</span>
                        <span className="text-slate-700 dark:text-slate-300 capitalize">
                          {u.identityInfo?.gender === "male"
                            ? "Erkek"
                            : u.identityInfo?.gender === "female"
                            ? "Kadın"
                            : u.identityInfo?.gender || "(Belirtilmedi)"}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 dark:text-slate-400 block">Kronik Rahatsızlıklar:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {u.identityInfo?.chronicDiseases || "Kayıtlı rahatsızlık yok"}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 dark:text-slate-400 block">Alerjiler:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {u.identityInfo?.allergies || "Yok"}
                        </span>
                      </div>

                      {u.identityInfo?.emergencyContactName && (
                        <div className="col-span-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Acil Durum İletişim:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">
                            {u.identityInfo.emergencyContactName} ({u.identityInfo.emergencyContactPhone || "-"})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password & Credentials Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Kullanıcı Şifresi:</span>
                      <code className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                        {u.password || "(Şifresiz)"}
                      </code>
                    </div>
                    {u.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">E-posta:</span>
                        <span className="text-slate-700 dark:text-slate-300">{u.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-slate-500">Kayıt Tarihi:</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{u.createdAt}</span>
                    </div>
                  </div>

                  {/* Granular Permission Toggles */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Yetki Ayarları (Aç / Kapa)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* canSendSms */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-300">SMS Gönderme</span>
                        <input
                          type="checkbox"
                          checked={u.permissions?.canSendSms ?? true}
                          disabled={isUpdating}
                          onChange={() => handleTogglePermission(u.id, "canSendSms")}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      {/* canManageSettings */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Ayar Değiştirme</span>
                        <input
                          type="checkbox"
                          checked={u.permissions?.canManageSettings ?? true}
                          disabled={isUpdating}
                          onChange={() => handleTogglePermission(u.id, "canManageSettings")}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      {/* canViewAllLogs */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Tüm Logları Görme</span>
                        <input
                          type="checkbox"
                          checked={u.permissions?.canViewAllLogs ?? false}
                          disabled={isUpdating}
                          onChange={() => handleTogglePermission(u.id, "canViewAllLogs")}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      {/* canAccessAdminPanel */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Admin Erişimi</span>
                        <input
                          type="checkbox"
                          checked={u.permissions?.canAccessAdminPanel ?? false}
                          disabled={isUpdating}
                          onChange={() => handleTogglePermission(u.id, "canAccessAdminPanel")}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Role Switcher */}
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Rolü Değiştir:</span>
                    <select
                      value={u.role}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as "admin" | "moderator" | "user")
                      }
                      className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="user">👤 Hasta / Kullanıcı</option>
                      <option value="moderator">🛡️ Moderatör</option>
                      <option value="admin">👑 Yönetici (Admin)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
