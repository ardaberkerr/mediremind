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
  apiFetchAllSmokingData,
  apiFetchAllMedications,
} from "@/lib/api/client";
import { SmokingProfile, CravingLog } from "@/lib/smoking/smokingStorage";
import { ScheduledMedication } from "@/lib/medications/medicationStorage";
import { HEALTH_MILESTONES } from "@/lib/smoking/healthMilestones";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
  adminUser: StoredUser;
  logs: SmsLogItem[];
  smsStatus: { status?: string; provider?: string; mode?: string };
  onRefreshLogs: () => void;
  onSmsTriggered: (to: string, message: string, provider: string) => void;
  onLogout?: () => void;
}

export default function AdminDashboard({
  adminUser,
  logs,
  smsStatus,
  onRefreshLogs,
  onSmsTriggered,
  onLogout,
}: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<"logs" | "users" | "smoking" | "sender" | "stats">("logs");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Smoking & Medication Data State
  const [smokingProfiles, setSmokingProfiles] = useState<SmokingProfile[]>([]);
  const [cravingLogs, setCravingLogs] = useState<CravingLog[]>([]);
  const [medicationsList, setMedicationsList] = useState<ScheduledMedication[]>([]);
  const [smokingFilter, setSmokingFilter] = useState<"all" | "both" | "smoking_only" | "meds_only" | "none">("all");
  const [selectedSmokingUser, setSelectedSmokingUser] = useState<string | null>(null);

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

  async function loadSmokingAndMedsData() {
    try {
      const smokingData = await apiFetchAllSmokingData();
      setSmokingProfiles(smokingData.profiles);
      setCravingLogs(smokingData.cravings);

      const meds = await apiFetchAllMedications();
      setMedicationsList(meds);
    } catch (err) {
      console.error("[loadSmokingAndMedsData] Error:", err);
    }
  }

  useEffect(() => {
    loadAllUsers();
    loadSmokingAndMedsData();
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

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      if (filterName.trim()) {
        const query = filterName.toLowerCase().trim();
        const matchesName = log.resolvedName.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      if (filterPhone.trim()) {
        const cleanQuery = filterPhone.replace(/\D/g, "");
        const cleanTo = (log.to || "").replace(/\D/g, "");
        const matchesPhone = cleanTo.includes(cleanQuery) || cleanTo.slice(-10).includes(cleanQuery);
        if (!matchesPhone) return false;
      }

      if (filterMedName.trim()) {
        const query = filterMedName.toLowerCase().trim();
        const inMed = (log.resolvedMedName || "").toLowerCase().includes(query);
        const inMsg = (log.message || "").toLowerCase().includes(query);
        if (!inMed && !inMsg) return false;
      }

      if (filterDosage.trim()) {
        const query = filterDosage.toLowerCase().trim();
        const inDosage = (log.resolvedDosage || "").toLowerCase().includes(query);
        const inMsg = (log.message || "").toLowerCase().includes(query);
        if (!inDosage && !inMsg) return false;
      }

      if (selectedProvider !== "all") {
        if ((log.provider || "").toLowerCase() !== selectedProvider.toLowerCase()) {
          return false;
        }
      }

      if (selectedStatus !== "all") {
        if (log.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedLogs, filterName, filterPhone, filterMedName, filterDosage, selectedProvider, selectedStatus]);

  const hasActiveFilters = Boolean(
    filterName || filterPhone || filterMedName || filterDosage || selectedProvider !== "all" || selectedStatus !== "all"
  );

  function handleResetFilters() {
    setFilterName("");
    setFilterPhone("");
    setFilterMedName("");
    setFilterDosage("");
    setSelectedProvider("all");
    setSelectedStatus("all");
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const q = userSearch.toLowerCase().trim();
    return usersList.filter((u) => {
      const matchName = u.name.toLowerCase().includes(q);
      const matchPhone = u.phone.includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchTc = (u.identityInfo?.tcKimlik || "").includes(q);
      const matchBlood = (u.identityInfo?.bloodType || "").toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchTc || matchBlood;
    });
  }, [usersList, userSearch]);

  // Quick Demo Test SMS
  async function handleQuickTest() {
    setTesting(true);
    setTestResult(null);

    const testNumber = usersList.find((u) => u.role !== "admin")?.phone || "+905551234567";
    const res = await sendTestSms();

    if (res.success) {
      setTestResult({
        type: "success",
        text: `⚡ Test SMS gönderildi! Sağlayıcı: [${res.activeProvider || "demo"}]`,
      });
      onSmsTriggered(
        testNumber,
        `❤️ Hızlı Test SMS: Sistem aktif ve çalışıyor (${new Date().toLocaleTimeString("tr-TR")}).`,
        res.activeProvider || "demo"
      );
      onRefreshLogs();
    } else {
      setTestResult({
        type: "error",
        text: `Hata: ${res.error || "SMS gönderilemedi"}`,
      });
    }

    setTesting(false);
  }

  // Clear Logs
  async function handleClearLogs() {
    if (!confirm("Tüm SMS log geçmişini temizlemek istediğinizden emin misiniz?")) return;
    const res = await clearAllSmsLogs();
    if (res) {
      onRefreshLogs();
      setTestResult({ type: "success", text: "Tüm log geçmişi başarıyla temizlendi." });
    }
  }

  // Send Custom SMS
  async function handleSendCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPhone.trim() || !customText.trim()) return;

    setSending(true);
    setTestResult(null);

    const res = await sendSms({ to: targetPhone.trim(), message: customText.trim() });

    if (res.success) {
      setTestResult({
        type: "success",
        text: `✅ SMS başarıyla gönderildi: [${res.activeProvider || "demo"}]`,
      });
      onSmsTriggered(targetPhone, customText, res.activeProvider || "demo");
      onRefreshLogs();
      setCustomText("");
    } else {
      setTestResult({
        type: "error",
        text: `Gönderim başarısız: ${res.error || "Bilinmeyen hata"}`,
      });
    }

    setSending(false);
  }

  // User Actions
  async function handleVerifyIdentity(userId: string) {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;

    const newVerified = !target.identityInfo?.isVerified;
    setUpdatingUserId(userId);

    const res = await apiUpdateUser(userId, {
      identityInfo: { ...target.identityInfo, isVerified: newVerified },
    });

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

  const successLogsCount = useMemo(() => logs.filter((l) => l.status === "success").length, [logs]);
  const verifiedUsersCount = useMemo(() => usersList.filter((u) => u.identityInfo?.isVerified).length, [usersList]);

  // Aggregate user module usage analysis
  const userModuleStats = useMemo(() => {
    return usersList.map((u) => {
      const cleanUserPhone = (u.phone || "").replace(/\D/g, "").slice(-10);

      // Check medications
      const userMeds = medicationsList.filter((m) => {
        if (m.userId && m.userId === u.id) return true;
        const cleanMedPhone = (m.phone || "").replace(/\D/g, "").slice(-10);
        return cleanMedPhone && cleanMedPhone === cleanUserPhone;
      });

      // Check smoking profile
      const smokingProf = smokingProfiles.find((sp) => sp.userId === u.id) || null;

      // Check cravings
      const userCravings = cravingLogs.filter((c) => c.userId === u.id);

      // Usage type classification
      const hasMeds = userMeds.length > 0;
      const hasSmoking = smokingProf !== null || userCravings.length > 0;

      let usageType: "both" | "smoking_only" | "meds_only" | "none" = "none";
      if (hasMeds && hasSmoking) {
        usageType = "both";
      } else if (hasSmoking) {
        usageType = "smoking_only";
      } else if (hasMeds) {
        usageType = "meds_only";
      }

      // Calculate quit duration if profile exists
      let smokeFreeStats = null;
      if (smokingProf && smokingProf.quitDate) {
        const quitTime = new Date(smokingProf.quitDate).getTime();
        const now = Date.now();
        const diffMs = Math.max(0, now - quitTime);
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

        const cigarettesNotSmoked = Math.floor((totalMinutes / (60 * 24)) * smokingProf.cigarettesPerDay);
        const costPerCigarette = smokingProf.pricePerPack / (smokingProf.cigarettesPerPack || 20);
        const moneySaved = Math.round(cigarettesNotSmoked * costPerCigarette);
        const lifeMinutesRegained = Math.round(cigarettesNotSmoked * 11);

        // Milestones passed
        const achievedMilestones = HEALTH_MILESTONES.filter((m) => totalMinutes >= m.minutesRequired);

        smokeFreeStats = {
          days,
          hours,
          totalMinutes,
          cigarettesNotSmoked,
          moneySaved,
          lifeMinutesRegained,
          achievedMilestonesCount: achievedMilestones.length,
          totalMilestonesCount: HEALTH_MILESTONES.length,
        };
      }

      return {
        user: u,
        hasMeds,
        medsCount: userMeds.length,
        userMeds,
        hasSmoking,
        smokingProf,
        userCravings,
        usageType,
        smokeFreeStats,
      };
    });
  }, [usersList, medicationsList, smokingProfiles, cravingLogs]);

  // Overall module usage counts
  const bothCount = useMemo(() => userModuleStats.filter((s) => s.usageType === "both").length, [userModuleStats]);
  const smokingOnlyCount = useMemo(() => userModuleStats.filter((s) => s.usageType === "smoking_only").length, [userModuleStats]);
  const medsOnlyCount = useMemo(() => userModuleStats.filter((s) => s.usageType === "meds_only").length, [userModuleStats]);
  const totalSmokingUsersCount = useMemo(() => userModuleStats.filter((s) => s.hasSmoking).length, [userModuleStats]);

  // Filtered module list
  const filteredModuleUsers = useMemo(() => {
    return userModuleStats.filter((s) => {
      if (smokingFilter !== "all" && s.usageType !== smokingFilter) {
        return false;
      }
      return true;
    });
  }, [userModuleStats, smokingFilter]);

  const navItems = [
    { id: "logs" as const, label: "SMS Logları & Canlı Akış", icon: "📋", badge: logs.length },
    { id: "users" as const, label: "Hasta & Yetki Yönetimi", icon: "👥", badge: usersList.length },
    { id: "smoking" as const, label: "Sigara Bırakma & Modül Analizi", icon: "🚭", badge: totalSmokingUsersCount },
    { id: "sender" as const, label: "Özel SMS Gönderici", icon: "✉️" },
    { id: "stats" as const, label: "Sistem & Performans", icon: "📊" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* 🧭 SOL SABİT PANEL (SIDEBAR NAVIGATION) */}
      <aside className="w-full lg:w-72 shrink-0 bg-slate-900/90 border border-emerald-900/50 rounded-3xl p-5 shadow-xl space-y-6 lg:sticky lg:top-24">
        {/* Admin Profil Başlığı */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-emerald-500/30">
            🛡️
          </div>
          <div className="overflow-hidden">
            <h3 className="font-black text-white text-sm truncate">{adminUser.name}</h3>
            <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              YÖNETİCİ PANELİ
            </span>
          </div>
        </div>

        {/* Canlı Sistem Durum Rozeti */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Sistem Modu</span>
            <span className="text-emerald-400 uppercase font-mono">{smsStatus.mode || "DEMO"}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Sağlayıcı</span>
            <span className="text-slate-200 uppercase font-mono">{smsStatus.provider || "NETGSM"}</span>
          </div>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>2.5s Canlı Takip Açık</span>
          </div>
        </div>

        {/* Menü Linkleri (Sol Dikey Menü) */}
        <nav className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
            YÖNETİM MENÜSÜ
          </p>
          {navItems.map((item) => {
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveAdminTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Hızlı Eylemler */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <Button
            onClick={handleQuickTest}
            disabled={testing}
            className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30 text-xs font-bold h-10 rounded-xl transition-all"
          >
            {testing ? "Gönderiliyor..." : "⚡ Hızlı Demo Test SMS"}
          </Button>

          <Button
            onClick={handleClearLogs}
            variant="ghost"
            className="w-full text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-bold h-9 rounded-xl"
          >
            🗑️ Logları Temizle
          </Button>
        </div>
      </aside>

      {/* 📄 SAĞ ANA İÇERİK ALANI */}
      <main className="flex-1 w-full space-y-6">
        {/* Bildirim / Sonuç Mesajı */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all animate-fadeIn ${
              testResult.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/60 text-rose-200"
            }`}
          >
            <span>{testResult.text}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold ml-2 bg-black/20 w-6 h-6 rounded-full"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: SMS LOGLARI & CANLI DENETİM */}
        {activeAdminTab === "logs" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Metrik Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam SMS</span>
                <span className="text-2xl font-black text-white">{logs.length}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Başarılı</span>
                <span className="text-2xl font-black text-emerald-400">{successLogsCount}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hatalı</span>
                <span className="text-2xl font-black text-rose-400">{logs.length - successLogsCount}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kayıtlı Hasta</span>
                <span className="text-2xl font-black text-teal-400">{usersList.length}</span>
              </div>
            </div>

            {/* Arama & Filtreleme Kutusu */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔎</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Gelişmiş SMS Filtreleme
                  </h3>
                  {hasActiveFilters && (
                    <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      Filtre Devrede
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    Sonuç: <strong className="text-emerald-400">{filteredLogs.length}</strong> / {logs.length}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <span>✕</span>
                      <span>Sıfırla</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtre Inputları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Hasta Adı</label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Ad soyad ara..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                    placeholder="Telefon no..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">İlaç Adı</label>
                  <input
                    type="text"
                    value={filterMedName}
                    onChange={(e) => setFilterMedName(e.target.value)}
                    placeholder="İlaç adı ara..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Dozaj</label>
                  <input
                    type="text"
                    value={filterDosage}
                    onChange={(e) => setFilterDosage(e.target.value)}
                    placeholder="Doz (mg, tablet)..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Açılır Menü Filtreleri */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">📡 Sağlayıcı:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tüm Sağlayıcılar</option>
                    <option value="demo">DEMO Mod</option>
                    <option value="netgsm">NETGSM</option>
                    <option value="twilio">TWILIO</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">🚦 Durum:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="success">✅ İletildi</option>
                    <option value="failed">❌ Hata</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Log Tablosu */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📋</span>
                  <span>Canlı SMS İletim Günlüğü</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Otomatik yenileniyor</span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Kayıtlı SMS bulunamadı veya arama kriteriyle eşleşmedi.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Zaman</th>
                        <th className="p-3.5">Hasta Adı</th>
                        <th className="p-3.5">Telefon</th>
                        <th className="p-3.5">İlaç & Doz</th>
                        <th className="p-3.5">Mesaj İçeriği</th>
                        <th className="p-3.5">Sağlayıcı</th>
                        <th className="p-3.5">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">{log.resolvedName}</td>
                          <td className="p-3.5 font-mono text-emerald-400 whitespace-nowrap">{log.to}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.resolvedMedName ? (
                              <div>
                                <span className="font-bold text-slate-200 block">💊 {log.resolvedMedName}</span>
                                {log.resolvedDosage && (
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                    {log.resolvedDosage}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Genel SMS</span>
                            )}
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-slate-300" title={log.message}>
                            {log.message}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {log.provider}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.status === "success" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                İletildi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
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
          </div>
        )}

        {/* TAB 2: HASTA VE YETKİ YÖNETİMİ */}
        {activeAdminTab === "users" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>👥</span>
                  <span>Hasta & Kullanıcı Yönetim Merkezi</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Toplam {usersList.length} kullanıcı kayıtlı ({verifiedUsersCount} kimlik onaylı)
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="İsim, telefon veya TC No ara..."
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Hasta Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((u) => {
                const isUpdating = updatingUserId === u.id;
                const hasTc = Boolean(u.identityInfo?.tcKimlik);

                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                      u.isSuspended
                        ? "bg-rose-950/20 border-rose-900/60"
                        : u.role === "admin"
                        ? "bg-emerald-950/30 border-emerald-900/60"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold ${
                            u.role === "admin" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {u.role === "admin" ? "🛡️" : "👤"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{u.name}</h4>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                u.role === "admin"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-emerald-400">{u.phone}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSuspend(u.id)}
                        disabled={isUpdating}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          u.isSuspended
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400"
                        }`}
                      >
                        {u.isSuspended ? "Askıyı Kaldır" : "Askıya Al"}
                      </button>
                    </div>

                    {/* Kimlik Özeti */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block">TC Kimlik</span>
                        <span className="font-mono font-bold text-slate-200">
                          {u.identityInfo?.tcKimlik || "Girilmedi"}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block">Kan Grubu</span>
                        <span className="font-bold text-slate-200">
                          {u.identityInfo?.bloodType || "Belirtilmedi"}
                        </span>
                      </div>
                    </div>

                    {/* Yetkilendirme & Doğrulama Butonları */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleVerifyIdentity(u.id)}
                        disabled={isUpdating || !hasTc}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                          u.identityInfo?.isVerified
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                        }`}
                      >
                        {u.identityInfo?.isVerified ? "✓ Kimlik Doğrulandı" : "Onaysız Kimlik"}
                      </button>

                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        disabled={isUpdating}
                        className="h-8 px-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                      >
                        <option value="user">Rol: Hasta (User)</option>
                        <option value="moderator">Rol: Moderatör</option>
                        <option value="admin">Rol: Admin</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: SİGARA BIRAKMA & MODÜL ANALİZİ */}
        {activeAdminTab === "smoking" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Üst Özet Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tümünü Kullanan
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{bothCount}</span>
                  <span className="text-xs text-slate-400">hasta</span>
                </div>
                <span className="text-[10px] text-emerald-500/80 font-semibold block mt-0.5">
                  İlaç + Sigara Bırakma
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sadece Sigara Bırakan
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-400">{smokingOnlyCount}</span>
                  <span className="text-xs text-slate-400">hasta</span>
                </div>
                <span className="text-[10px] text-amber-500/80 font-semibold block mt-0.5">
                  Yalnızca Bırakma Modülü
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sadece İlaç Takibi
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-cyan-400">{medsOnlyCount}</span>
                  <span className="text-xs text-slate-400">hasta</span>
                </div>
                <span className="text-[10px] text-cyan-500/80 font-semibold block mt-0.5">
                  Yalnızca Hatırlatıcı
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Toplam Kriz Bildirimi
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-400">{cravingLogs.length}</span>
                  <span className="text-xs text-slate-400">kayıt</span>
                </div>
                <span className="text-[10px] text-rose-500/80 font-semibold block mt-0.5">
                  SOS & Günlük İletileri
                </span>
              </div>
            </div>

            {/* Segment Filtreleme Çubuğu */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase mr-1">Segment Filtresi:</span>
                <button
                  onClick={() => setSmokingFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    smokingFilter === "all"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Tümü ({userModuleStats.length})
                </button>
                <button
                  onClick={() => setSmokingFilter("both")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    smokingFilter === "both"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🌟 Her Şeyi Kullananlar ({bothCount})
                </button>
                <button
                  onClick={() => setSmokingFilter("smoking_only")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    smokingFilter === "smoking_only"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🚭 Sadece Sigara ({smokingOnlyCount})
                </button>
                <button
                  onClick={() => setSmokingFilter("meds_only")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    smokingFilter === "meds_only"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  💊 Sadece İlaç ({medsOnlyCount})
                </button>
              </div>

              <Button
                onClick={loadSmokingAndMedsData}
                variant="outline"
                className="h-9 px-3 text-xs font-bold bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              >
                🔄 Verileri Yenile
              </Button>
            </div>

            {/* Kullanıcı Modül Kullanım Tablosu */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>👥</span>
                    <span>Kullanıcı Modül Dağılımı ve Başarı Analizi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hangi hastanın sigara bırakma modülünü, hangisinin ilaç hatırlatıcısını kullandığını canlı izleyin.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl">
                  {filteredModuleUsers.length} Kullanıcı
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                    <tr>
                      <th className="p-3.5">Kullanıcı</th>
                      <th className="p-3.5">Kullanım Durumu</th>
                      <th className="p-3.5">İlaç Takibi</th>
                      <th className="p-3.5">Sigarasız Süre & Tasarruf</th>
                      <th className="p-3.5">Kriz / SOS Sayısı</th>
                      <th className="p-3.5 text-right">Detay & Eylem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredModuleUsers.map((item) => {
                      const isSelected = selectedSmokingUser === item.user.id;
                      return (
                        <React.Fragment key={item.user.id}>
                          <tr className={`hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-slate-800/60" : ""}`}>
                            <td className="p-3.5">
                              <div className="font-bold text-white text-sm">{item.user.name}</div>
                              <div className="font-mono text-slate-400 text-[11px]">{item.user.phone}</div>
                              {item.user.email && (
                                <div className="text-slate-500 text-[10px]">{item.user.email}</div>
                              )}
                            </td>

                            <td className="p-3.5">
                              {item.usageType === "both" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  <span>🌟</span>
                                  <span>Tüm Modülleri Kullanıyor</span>
                                </span>
                              )}
                              {item.usageType === "smoking_only" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  <span>🚭</span>
                                  <span>Yalnızca Sigara Bırakma</span>
                                </span>
                              )}
                              {item.usageType === "meds_only" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                                  <span>💊</span>
                                  <span>Yalnızca İlaç Takibi</span>
                                </span>
                              )}
                              {item.usageType === "none" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <span>⚪</span>
                                  <span>Henüz Aktif Veri Yok</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              {item.hasMeds ? (
                                <div>
                                  <span className="font-bold text-slate-200">
                                    {item.medsCount} Kayıtlı İlaç
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                    {item.userMeds.map((m) => `${m.name} (${m.dosage})`).join(", ")}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">İlaç kaydı yok</span>
                              )}
                            </td>

                            <td className="p-3.5">
                              {item.smokeFreeStats ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-emerald-400">
                                    {item.smokeFreeStats.days} Gün {item.smokeFreeStats.hours} Saat
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {item.smokeFreeStats.cigarettesNotSmoked} dal içilmedi •{" "}
                                    <span className="text-emerald-400 font-bold">
                                      {item.smokeFreeStats.moneySaved} TL
                                    </span>{" "}
                                    cepte
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Bırakma profili yok</span>
                              )}
                            </td>

                            <td className="p-3.5">
                              {item.userCravings.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {item.userCravings.length} Kriz Kaydı
                                </span>
                              ) : (
                                <span className="text-slate-500">Kriz yok</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <Button
                                onClick={() => setSelectedSmokingUser(isSelected ? null : item.user.id)}
                                variant="ghost"
                                className="h-8 px-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 rounded-xl"
                              >
                                {isSelected ? "Kapat ▲" : "İncele ▼"}
                              </Button>
                            </td>
                          </tr>

                          {/* Detay Açılır Panel */}
                          {isSelected && (
                            <tr className="bg-slate-950/80">
                              <td colSpan={6} className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Sigara Bırakma Detayları */}
                                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                      <span>🚭</span>
                                      <span>Sigara Bırakma İlerleme Durumu</span>
                                    </h4>

                                    {item.smokingProf ? (
                                      <div className="space-y-2 text-xs">
                                        <div className="flex justify-between border-b border-slate-800 pb-1.5">
                                          <span className="text-slate-400">Bırakma Tarihi:</span>
                                          <span className="text-white font-mono">
                                            {new Date(item.smokingProf.quitDate).toLocaleString("tr-TR")}
                                          </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1.5">
                                          <span className="text-slate-400">Günde İçilen:</span>
                                          <span className="text-white font-bold">{item.smokingProf.cigarettesPerDay} dal</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1.5">
                                          <span className="text-slate-400">Paket Fiyatı:</span>
                                          <span className="text-emerald-400 font-bold">{item.smokingProf.pricePerPack} TL</span>
                                        </div>
                                        {item.smokingProf.motivationReason && (
                                          <div className="border-b border-slate-800 pb-1.5">
                                            <span className="text-slate-400 block mb-0.5">Bırakma Nedeni / Motivasyon:</span>
                                            <span className="text-amber-200 font-semibold italic">"{item.smokingProf.motivationReason}"</span>
                                          </div>
                                        )}
                                        {item.smokingProf.savedMoneyGoal && (
                                          <div className="border-b border-slate-800 pb-1.5">
                                            <span className="text-slate-400 block mb-0.5">Hedef Ödül:</span>
                                            <span className="text-teal-300 font-semibold">🎁 {item.smokingProf.savedMoneyGoal}</span>
                                          </div>
                                        )}

                                        {item.smokeFreeStats && (
                                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2 space-y-1">
                                            <div className="flex justify-between text-[11px]">
                                              <span className="text-slate-400">Geri Kazanılan Ömür:</span>
                                              <span className="text-emerald-400 font-bold">
                                                +{Math.round(item.smokeFreeStats.lifeMinutesRegained / 60)} saat ({item.smokeFreeStats.lifeMinutesRegained} dk)
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                              <span className="text-slate-400">WHO Başarı Adımları:</span>
                                              <span className="text-cyan-400 font-bold">
                                                {item.smokeFreeStats.achievedMilestonesCount} / {item.smokeFreeStats.totalMilestonesCount} Adım Tamamlandı
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">Kullanıcı henüz sigara bırakma profili tanımlamamış.</p>
                                    )}

                                    {/* Kriz Geçmişi */}
                                    {item.userCravings.length > 0 && (
                                      <div className="pt-2">
                                        <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Kriz Günlüğü & Tetikleyiciler:</span>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                          {item.userCravings.map((crav) => (
                                            <div key={crav.id} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center">
                                              <div>
                                                <span className="text-rose-400 font-bold">Şiddet: {crav.intensity}/10</span>
                                                <span className="text-slate-400 ml-2 font-mono">[{crav.trigger}]</span>
                                                {crav.overcomeWith && (
                                                  <span className="text-emerald-400 ml-2">✓ {crav.overcomeWith}</span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-slate-500">
                                                {new Date(crav.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* İlaç Takip Detayları & Destek SMS'i */}
                                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                                    <div>
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2">
                                        <span>💊</span>
                                        <span>Kayıtlı İlaçlar & Rutin</span>
                                      </h4>

                                      {item.userMeds.length > 0 ? (
                                        <div className="space-y-2">
                                          {item.userMeds.map((med) => (
                                            <div key={med.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                                              <div>
                                                <span className="font-bold text-white">{med.name}</span>
                                                <span className="text-slate-400 ml-2">({med.dosage})</span>
                                                {med.notes && <p className="text-[10px] text-slate-500 mt-0.5">{med.notes}</p>}
                                              </div>
                                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono font-bold rounded-lg text-xs">
                                                ⏰ {med.reminderTime}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-500 italic">Bu kullanıcı için kayıtlı ilaç bulunmuyor.</p>
                                      )}
                                    </div>

                                    {/* Hastaya Özel Destek SMS Butonu */}
                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                                      <span className="text-xs text-slate-400">Motivasyon / İlaç Desteği İlet:</span>
                                      <Button
                                        onClick={() => {
                                          setTargetPhone(item.user.phone);
                                          if (item.smokeFreeStats) {
                                            setCustomText(
                                              `Tebrikler ${item.user.name}! Sigarasız ${item.smokeFreeStats.days} günü geride bıraktınız. Sağlığınız her geçen saat daha da güçleniyor, bu yolda yanınızdayız! – MediRemind Destek Ekibi`
                                            );
                                          } else {
                                            setCustomText(
                                              `Sayın ${item.user.name}, sağlıklı yaşam yolculuğunuzda MediRemind yanınızda!`
                                            );
                                          }
                                          setActiveAdminTab("sender");
                                        }}
                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
                                      >
                                        ✉️ Destek SMS'i Hazırla
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ÖZEL SMS GÖNDERİCİ */}
        {activeAdminTab === "sender" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>✉️</span>
                <span>Anlık Özel SMS Gönderici (Admin)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dilediğiniz hastaya doğrudan anlık SMS gönderebilirsiniz.
              </p>
            </div>

            <form onSubmit={handleSendCustom} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Kayıtlı Hastadan Seçin
                </label>
                <select
                  onChange={(e) => setTargetPhone(e.target.value)}
                  value={targetPhone}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.phone}>
                      {u.name} — {u.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Alıcı Telefon Numarası
                </label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+905551234567"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Mesaj İçeriği
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={4}
                  placeholder="Mesaj metnini buraya yazın..."
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 text-xs"
              >
                {sending ? "Gönderiliyor..." : "✉️ Özel SMS Gönder"}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 4: SİSTEM & PERFORMANS İSTATİSTİKLERİ */}
        {activeAdminTab === "stats" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>📊</span>
                <span>Sistem Sağlığı & Genel Rapor</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Veri Tabanı Mimarisi</span>
                  <p className="text-sm font-bold text-emerald-400">Dosya Tabanlı Atomik JSON Depolama</p>
                  <p className="text-xs text-slate-500">
                    users.json, medications.json, sms_logs.json, smoking_profiles.json
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Güvenlik Protokolü</span>
                  <p className="text-sm font-bold text-teal-400">bcrypt Hash Koruması & Yetkilendirme</p>
                  <p className="text-xs text-slate-500">Tüm kullanıcı parolaları tek yönlü şifrelenir.</p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Arka Plan Hatırlatma Motoru</span>
                  <p className="text-sm font-bold text-emerald-400">30 Saniyede Bir Otomatik Scheduler</p>
                  <p className="text-xs text-slate-500">İlaç saati gelen hastalara otomatik Web Push ve SMS atar.</p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">PWA & Mobil Destek</span>
                  <p className="text-sm font-bold text-teal-400">Tam Ekran WebAPK & Service Worker v2</p>
                  <p className="text-xs text-slate-500">iOS ve Android'de ana ekrana eklenebilir, çevrimdışı önbellekleme destekler.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
