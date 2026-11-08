"use client";

import React, { useState, useEffect } from "react";
import { StoredUser } from "@/lib/auth/userStorage";
import { SmsLogItem, apiUpdateUser } from "@/lib/api/client";
import MedicationForm from "@/components/MedicationForm";
import MobileBottomNav from "@/components/MobileBottomNav";
import PatientIdentityModal from "@/components/PatientIdentityModal";
import { Button } from "@/components/ui/button";

// ── Props ─────────────────────────────────────────────────────────────────
interface UserDashboardProps {
  user: StoredUser;
  logs: SmsLogItem[];
  onRefreshLogs: () => Promise<void>;
  onSmsTriggered: (to: string, message: string, provider?: string) => void;
  onUpdateUser: (updated: StoredUser) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("tr-TR");
  } catch {
    return dateStr;
  }
}

type TabKey = "reminders" | "notifications" | "identity" | "settings";

// ── Component ─────────────────────────────────────────────────────────────
export default function UserDashboard({
  user,
  logs,
  onRefreshLogs,
  onSmsTriggered,
  onUpdateUser,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("reminders");
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Local settings copy for the settings form
  const [localSettings, setLocalSettings] = useState({ ...user.settings });

  // Check push subscription on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(!!sub);
    });
  }, []);

  // ── Push notification ─────────────────────────────────────────────────
  async function handleTogglePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Bu tarayıcı push bildirimlerini desteklemiyor.");
      return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint, userId: user.id }),
          });
        }
        setPushEnabled(false);
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          alert("VAPID anahtarı yapılandırılmamış.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Bildirim izni verilmedi. Tarayıcı ayarlarından izin verin.");
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub, userId: user.id }),
        });
        setPushEnabled(true);
      }
    } catch (err: any) {
      alert("Push bildirimi hatası: " + (err?.message ?? err));
    } finally {
      setPushLoading(false);
    }
  }

  // ── Settings save ─────────────────────────────────────────────────────
  async function handleSaveSettings() {
    setSettingsSaving(true);
    setSettingsFeedback(null);
    try {
      const result = await apiUpdateUser(user.id, { settings: localSettings });
      if (result?.success && result.user) {
        onUpdateUser(result.user);
        setSettingsFeedback("✅ Ayarlar kaydedildi.");
      } else {
        setSettingsFeedback("❌ Kayıt başarısız: " + (result?.error ?? "bilinmeyen hata"));
      }
    } catch {
      setSettingsFeedback("❌ Sunucu hatası.");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsFeedback(null), 3000);
    }
  }

  // ── Tabs config ───────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "reminders", label: "İlaçlar", icon: "💊" },
    { key: "notifications", label: "Bildirimler", icon: "🔔" },
    { key: "identity", label: "Kimlik", icon: "🆔" },
    { key: "settings", label: "Ayarlar", icon: "⚙️" },
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-28 md:pb-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-black">Hoş Geldiniz, {user.name}</h2>
            <p className="text-sm text-emerald-100 opacity-90">{user.phone}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: İlaçlar ── */}
      {activeTab === "reminders" && (
        <div>
          <MedicationForm
            defaultPhone={user.phone}
            onMedicationAdded={onRefreshLogs}
            onSmsTriggered={onSmsTriggered}
          />
        </div>
      )}

      {/* ── Tab: Bildirimler ── */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {/* Push toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-base flex items-center gap-2">
              🔔 Anlık Bildirimler (Push)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Uygulama arka planda veya kapalıyken ilaç hatırlatması almak için etkinleştirin.
            </p>
            <Button
              onClick={handleTogglePush}
              disabled={pushLoading}
              className={`w-full h-11 rounded-xl font-bold text-sm shadow-sm transition-all ${
                pushEnabled
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {pushLoading
                ? "⏳ İşleniyor..."
                : pushEnabled
                ? "🔕 Bildirimleri Kapat"
                : "🔔 Bildirimleri Aç"}
            </Button>
            {pushEnabled && (
              <p className="mt-3 text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ Push bildirimleri etkin — ilaç saatlerinde uyarı alacaksınız.
              </p>
            )}
          </div>

          {/* SMS log */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                📱 SMS Geçmişi
              </h3>
              <button
                onClick={onRefreshLogs}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Yenile
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                Henüz SMS geçmişi yok.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {log.to}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          log.status === "success"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        }`}
                      >
                        {log.status === "success" ? "✓ Gönderildi" : "✕ Hata"}                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{log.message}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Kimlik ── */}
      {activeTab === "identity" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            🆔 Kişisel Bilgiler
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: "Ad Soyad", value: user.name },
              { label: "Telefon", value: user.phone },
              { label: "E-posta", value: user.email },
              { label: "TC Kimlik No", value: user.identityInfo?.tcKimlik },
              { label: "Doğum Tarihi", value: user.identityInfo?.birthDate },
              { label: "Cinsiyet", value: user.identityInfo?.gender },
              { label: "Kan Grubu", value: user.identityInfo?.bloodType },
              { label: "Şehir", value: user.identityInfo?.city },
              { label: "Kronik Hastalıklar", value: user.identityInfo?.chronicDiseases },
              { label: "Alerjiler", value: user.identityInfo?.allergies },
              {
                label: "Acil İletişim",
                value: user.identityInfo?.emergencyContactName
                  ? `${user.identityInfo.emergencyContactName} — ${user.identityInfo.emergencyContactPhone ?? ""}`
                  : undefined,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-4 py-3"
              >
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 break-words">
                  {value || <span className="text-slate-400 font-normal">—</span>}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setShowIdentityModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl"
          >
            ✏️ Bilgileri Düzenle
          </Button>

          {showIdentityModal && (
            <PatientIdentityModal
              isOpen={showIdentityModal}
              user={user}
              onClose={() => setShowIdentityModal(false)}
              onSaved={(updated) => {
                onUpdateUser(updated);
                setShowIdentityModal(false);
              }}
            />
          )}
        </div>
      )}

      {/* ── Tab: Ayarlar ── */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            ⚙️ Uygulama Ayarları
          </h3>

          {/* Toggle switches */}
          {[
            {
              key: "autoSmsEnabled" as const,
              label: "Otomatik SMS Gönderimi",
              desc: "İlaç saatinde otomatik SMS at",
              icon: "📱",
            },
            {
              key: "soundEnabled" as const,
              label: "Sesli Bildirim",
              desc: "Hatırlatma sesi çal",
              icon: "🔊",
            },
            {
              key: "emailNotification" as const,
              label: "E-posta Bildirimi",
              desc: "İlaç saatinde e-posta gönder",
              icon: "📧",
            },
          ].map(({ key, label, desc, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  {icon} {label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() =>
                  setLocalSettings((s) => ({ ...s, [key]: !s[key] }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings[key]
                    ? "bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    localSettings[key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}

          {/* Snooze duration */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              ⏰ Erteleme Süresi (Dakika)
            </label>
            <select
              value={localSettings.snoozeDurationMinutes}
              onChange={(e) =>
                setLocalSettings((s) => ({
                  ...s,
                  snoozeDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m} dakika
                </option>
              ))}
            </select>
          </div>

          {/* Emergency contact */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              🆘 Acil Durum Telefonu
            </label>
            <input
              type="tel"
              value={localSettings.emergencyContact}
              onChange={(e) =>
                setLocalSettings((s) => ({
                  ...s,
                  emergencyContact: e.target.value,
                }))
              }
              placeholder="+905XXXXXXXXX"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Theme */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              🎨 Tema
            </label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLocalSettings((s) => ({ ...s, theme: t }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    localSettings.theme === t
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {t === "light" ? "☀️ Aydınlık" : t === "dark" ? "🌙 Karanlık" : "🖥️ Sistem"}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-sm"
          >
            {settingsSaving ? "⏳ Kaydediliyor..." : "💾 Ayarları Kaydet"}
          </Button>

          {settingsFeedback && (
            <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {settingsFeedback}
            </p>
          )}
        </div>
      )}

      {/* Mobile bottom nav */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        notificationCount={logs.filter((l) => l.status === "success").length}
        isIdentityVerified={user.identityInfo?.isVerified}
      />
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
