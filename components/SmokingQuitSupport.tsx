"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HEALTH_MILESTONES, MOTIVATION_TIPS } from "@/lib/smoking/healthMilestones";
import BreathingExerciseModal from "./BreathingExerciseModal";

interface SmokingQuitSupportProps {
  userId: string;
  userName?: string;
  onSmsTriggered?: (to: string, message: string, provider?: string) => void;
  userPhone?: string;
}

export default function SmokingQuitSupport({
  userId,
  userName = "Değerli Kullanıcı",
  onSmsTriggered,
  userPhone,
}: SmokingQuitSupportProps) {
  const [profile, setProfile] = useState<any>(null);
  const [cravings, setCravings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [quitDateInput, setQuitDateInput] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [cigarettesPerDay, setCigarettesPerDay] = useState(20);
  const [pricePerPack, setPricePerPack] = useState(75);
  const [cigarettesPerPack, setCigarettesPerPack] = useState(20);
  const [yearsSmoked, setYearsSmoked] = useState(5);
  const [motivationReason, setMotivationReason] = useState("Daha sağlıklı ve özgür bir hayat");
  const [savedMoneyGoal, setSavedMoneyGoal] = useState("Yeni bir telefon / Tatil");

  // Kriz Savar Modal & State
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showCravingForm, setShowCravingForm] = useState(false);
  const [cravingIntensity, setCravingIntensity] = useState(7);
  const [cravingTrigger, setCravingTrigger] = useState("Kahve / Yemek sonrası");
  const [cravingNotes, setCravingNotes] = useState("");
  const [randomTipIndex, setRandomTipIndex] = useState(0);

  // Canlı Sayaç (Her saniye güncellenir)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [userId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/smoking?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setCigarettesPerDay(data.profile.cigarettesPerDay || 20);
        setPricePerPack(data.profile.pricePerPack || 75);
        setCigarettesPerPack(data.profile.cigarettesPerPack || 20);
        setYearsSmoked(data.profile.yearsSmoked || 5);
        setMotivationReason(data.profile.motivationReason || "");
        setSavedMoneyGoal(data.profile.savedMoneyGoal || "");
        // Format ISO to input datetime-local
        if (data.profile.quitDate) {
          const d = new Date(data.profile.quitDate);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setQuitDateInput(localISOTime);
        }
      }
      if (data.cravings) {
        setCravings(data.cravings);
      }
    } catch (err) {
      console.error("[SmokingSupport] loadData error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/smoking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveProfile",
          userId,
          quitDate: new Date(quitDateInput).toISOString(),
          cigarettesPerDay,
          pricePerPack,
          cigarettesPerPack,
          yearsSmoked,
          motivationReason,
          savedMoneyGoal,
        }),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Profil kaydedilemedi. Lütfen tekrar deneyin.");
    }
  }

  async function handleLogCraving(overcomeWithMethod: string = "Nefes Egzersizi & Soğuk Su") {
    try {
      const res = await fetch("/api/smoking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "logCraving",
          userId,
          intensity: cravingIntensity,
          trigger: cravingTrigger,
          notes: cravingNotes,
          overcomeWith: overcomeWithMethod,
        }),
      });
      const data = await res.json();
      if (data.success && data.craving) {
        setCravings((prev) => [data.craving, ...prev]);
        setShowCravingForm(false);
        setCravingNotes("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Hesaplamalar
  let diffMs = 0;
  let totalMinutes = 0;
  let days = 0, hours = 0, minutes = 0, seconds = 0;
  let notSmokedCount = 0;
  let savedMoney = 0;
  let lifeRegainedHours = 0; // Her sigara yaklaşık 11 dakika ömür götürür

  if (profile?.quitDate) {
    const quitTime = new Date(profile.quitDate).getTime();
    diffMs = Math.max(0, now.getTime() - quitTime);
    totalMinutes = Math.floor(diffMs / (1000 * 60));

    days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const cigarettesPerMinute = (profile.cigarettesPerDay || 20) / (24 * 60);
    notSmokedCount = Math.floor(totalMinutes * cigarettesPerMinute);

    const costPerCigarette = (profile.pricePerPack || 75) / (profile.cigarettesPerPack || 20);
    savedMoney = Math.floor(notSmokedCount * costPerCigarette);

    // 1 sigara = ~11 dakika kazanılan yaşam süresi
    lifeRegainedHours = Math.floor((notSmokedCount * 11) / 60);
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Sigara Bırakma Destek Asistanı Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 🚀 Üst Başlık & Acil Kriz Butonu */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[11px] font-black uppercase tracking-wider">
              🚭 DUMANSIZ VE ÖZGÜR BİR YAŞAM
            </div>
            <h2 className="text-2xl font-black tracking-tight">Sigara Bırakma Destek Merkezi</h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-lg">
              Her içilmeyen sigara, ciğerlerinize çekilen tertemiz bir nefes ve geleceğinize yapılan bir yatırımdır.
            </p>
          </div>

          {/* Acil Durum / Kriz Butonu */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={() => setShowBreathingModal(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-5 h-12 rounded-2xl shadow-lg shadow-amber-400/30 flex items-center gap-2 text-sm active:scale-95 transition-all"
            >
              <span className="text-lg">🆘</span>
              <span>CANIM SİGARA İSTİYOR!</span>
            </Button>
            <p className="text-[10px] text-center text-emerald-100/80 font-medium">
              3 dakikalık kriz savar nefes tekniği
            </p>
          </div>
        </div>

        {/* Arka plan dekorasyonu */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-8xl opacity-10 select-none pointer-events-none">
          🫁
        </div>
      </div>

      {/* ⚙️ Profil Yoksa veya Düzenleme Moduysa: Kurulum Formu */}
      {(!profile || isEditing) && (
        <Card className="p-6 border-emerald-500/30 bg-white dark:bg-slate-900 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              <span>Sigarayı Bırakma Planınızı Oluşturun</span>
            </h3>
            {profile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold"
              >
                Vazgeç
              </Button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Sigarayı Bırakma (Son Dal) Tarihi & Saati
                </label>
                <input
                  type="datetime-local"
                  value={quitDateInput}
                  onChange={(e) => setQuitDateInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Günde Ortalama Kaç Dal İçiyordunuz?
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={cigarettesPerDay}
                  onChange={(e) => setCigarettesPerDay(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1 Paket Sigara Fiyatı (TL)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={pricePerPack}
                  onChange={(e) => setPricePerPack(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kaç Yıldır Sigara Kullanıyordunuz?
                </label>
                <input
                  type="number"
                  min="1"
                  max="70"
                  value={yearsSmoked}
                  onChange={(e) => setYearsSmoked(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                En Büyük Bırakma Motivasyonunuz Ne?
              </label>
              <input
                type="text"
                placeholder="Örn: Çocuklarımın büyüdüğünü görmek, rahat nefes almak, spor yapabilmek..."
                value={motivationReason}
                onChange={(e) => setMotivationReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tasarruf Ettiğiniz Parayla Kendinize Ne Alacaksınız? (Ödül Hedefi)
              </label>
              <input
                type="text"
                placeholder="Örn: Ailemle tatil, Yeni telefon, Akıllı saat, Spor bisikleti..."
                value={savedMoneyGoal}
                onChange={(e) => setSavedMoneyGoal(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-sm"
            >
              🎯 Bırakma Sayacını Başlat & Kaydet
            </Button>
          </form>
        </Card>
      )}

      {/* 📊 Aktif Sayaç ve İstatistik Göstergesi */}
      {profile && !isEditing && (
        <>
          {/* Canlı Kronometre Kartı */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  DUMANSIZ GEÇEN SÜRE
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold"
              >
                ✏️ Ayarları Düzenle
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <div className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {days}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">
                  Gün
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <div className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {hours}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">
                  Saat
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <div className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {minutes}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">
                  Dakika
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <div className="text-2xl sm:text-4xl font-black text-emerald-500 font-mono">
                  {seconds}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">
                  Saniye
                </div>
              </div>
            </div>

            {profile.motivationReason && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>
                  <strong>Motivasyonum:</strong> "{profile.motivationReason}"
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Bırakma: {new Date(profile.quitDate).toLocaleDateString("tr-TR")}
                </span>
              </div>
            )}
          </div>

          {/* 💰 Başarı Metrikleri (İçilmeyen Sigara, Para, Ömür) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl shrink-0 font-bold">
                🚭
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">İçilmeyen Sigara</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {notSmokedCount} <span className="text-sm font-normal text-slate-500">Dal</span>
                </h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Zehirden kurtuldunuz</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shrink-0 font-bold">
                💰
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cebinizde Kalan Para</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₺{savedMoney.toLocaleString("tr-TR")}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                  Hedef: {profile.savedMoneyGoal || "Kişisel Tasarruf"}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center text-3xl shrink-0 font-bold">
                ⏳
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kazanılan Ömür</p>
                <h4 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
                  +{lifeRegainedHours} <span className="text-sm font-normal text-slate-500">Saat</span>
                </h4>
                <p className="text-[11px] text-teal-600/90 dark:text-teal-400 font-medium">Temiz yaşam süresi</p>
              </div>
            </div>
          </div>

          {/* 🫁 Vücut İyileşme Zaman Tüneli (Health Milestones) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🫁</span>
                  <span>Vücudunuzun İyileşme Yolculuğu (WHO & CDC)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bıraktığınız andan itibaren vücudunuzun kendini yenileme aşamaları
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {HEALTH_MILESTONES.map((milestone) => {
                const isCompleted = totalMinutes >= milestone.minutesRequired;
                const progressPct = Math.min(
                  100,
                  Math.round((totalMinutes / milestone.minutesRequired) * 100)
                );

                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 opacity-90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{milestone.organ}</span>
                        <div>
                          <h5 className="text-sm font-extrabold leading-tight">{milestone.title}</h5>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Kaynak: {milestone.source}
                          </span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0">
                          ✓ BAŞARILDI
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-amber-500 shrink-0">
                          %{progressPct}
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* İlerleme Çubuğu */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 💡 Günün Bırakma Taktikleri & Kriz Savar Kartı */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>💡</span> GÜNÜN MOTİVASYON REHBERİ
              </span>
              <button
                onClick={() =>
                  setRandomTipIndex((prev) => (prev + 1) % MOTIVATION_TIPS.length)
                }
                className="text-xs text-amber-700 dark:text-amber-300 font-bold hover:underline"
              >
                Yeni İpucu ↻
              </button>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">
              "{MOTIVATION_TIPS[randomTipIndex]}"
            </p>
          </div>

          {/* 📝 Kriz Günlüğü / Destek Kayıtları */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Kriz & İstek Geçmişi</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Canınız her sigara istediğinde nasıl atlattığınızı kaydedin, gücünüzü görün.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setShowCravingForm(!showCravingForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {showCravingForm ? "✕ Kapat" : "+ Kriz Kaydı Ekle"}
              </Button>
            </div>

            {showCravingForm && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      İstek Şiddeti (1 - 10): {cravingIntensity}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={cravingIntensity}
                      onChange={(e) => setCravingIntensity(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Tetikleyici Neden
                    </label>
                    <select
                      value={cravingTrigger}
                      onChange={(e) => setCravingTrigger(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="Kahve / Yemek sonrası">Kahve / Yemek sonrası</option>
                      <option value="İş / Hayat Stresi">İş / Hayat Stresi</option>
                      <option value="Sosyal Ortam / Arkadaşlar">Sosyal Ortam / Arkadaşlar</option>
                      <option value="Can Sıkıntısı / Boş Zaman">Can Sıkıntısı / Boş Zaman</option>
                      <option value="Alkol / Eğlence">Alkol / Eğlence</option>
                      <option value="Sabah Uyanınca">Sabah Uyanınca</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nasıl Atlattınız / Notunuz
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 1 büyük bardak su içtim ve balkondan temiz hava aldım"
                    value={cravingNotes}
                    onChange={(e) => setCravingNotes(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <Button
                  onClick={() => handleLogCraving(cravingNotes || "Nefes egzersizi & Kararlılık")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg text-xs"
                >
                  ✓ Krizi Yendim, Kaydet
                </Button>
              </div>
            )}

            {cravings.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Henüz kayıtlı bir kriz dalgası yok. Canınız sigara istediğinde nefes egzersizini kullanabilir veya buraya not düşebilirsiniz.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {cravings.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.trigger}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-extrabold text-[10px]">
                          Şiddet: {item.intensity}/10
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Başarıldı: {item.overcomeWith || item.notes || "Kararlılıkla aşıldı"}
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 4-7-8 Nefes Egzersizi Pop-up */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
        onFinished={() => {
          handleLogCraving("4-7-8 Kriz Savar Nefes Tekniği");
        }}
      />
    </div>
  );
}
