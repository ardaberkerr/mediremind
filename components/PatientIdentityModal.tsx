"use client";

import React, { useState } from "react";
import { StoredUser, UserIdentityInfo } from "@/lib/auth/userStorage";
import { apiUpdateUser } from "@/lib/api/client";
import { validateTcKimlik } from "@/lib/validation/tcKimlikValidator";
import { Button } from "@/components/ui/button";

interface PatientIdentityModalProps {
  isOpen: boolean;
  user: StoredUser;
  onClose: () => void;
  onSaved: (updatedUser: StoredUser) => void;
  isMandatory?: boolean;
}

export default function PatientIdentityModal({
  isOpen,
  user,
  onClose,
  onSaved,
  isMandatory = false,
}: PatientIdentityModalProps) {
  const [formData, setFormData] = useState<UserIdentityInfo>({
    tcKimlik: user.identityInfo?.tcKimlik || "",
    birthDate: user.identityInfo?.birthDate || "",
    gender: user.identityInfo?.gender || "",
    bloodType: user.identityInfo?.bloodType || "",
    chronicDiseases: user.identityInfo?.chronicDiseases || "",
    allergies: user.identityInfo?.allergies || "",
    emergencyContactName: user.identityInfo?.emergencyContactName || "",
    emergencyContactPhone: user.identityInfo?.emergencyContactPhone || "",
    city: user.identityInfo?.city || "",
    address: user.identityInfo?.address || "",
    isVerified: user.identityInfo?.isVerified || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.tcKimlik || !validateTcKimlik(formData.tcKimlik)) {
      setError("Lütfen algoritması geçerli 11 haneli T.C. Kimlik Numaranızı giriniz.");
      setLoading(false);
      return;
    }

    if (!formData.birthDate) {
      setError("Lütfen doğum tarihinizi giriniz.");
      setLoading(false);
      return;
    }

    if (!formData.bloodType) {
      setError("Lütfen kan grubunuzu seçiniz.");
      setLoading(false);
      return;
    }

    const res = await apiUpdateUser(user.id, {
      identityInfo: {
        ...formData,
        isVerified: true,
      },
    });

    if (res.success && res.user) {
      onSaved(res.user);
      onClose();
    } else {
      setError(res.error || "Kimlik bilgileri kaydedilemedi.");
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 space-y-6 relative transition-colors max-h-[90vh] overflow-y-auto">
        {!isMandatory && (
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all"
          >
            ✕
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 text-2xl font-bold">
            🆔
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900">
            Sağlık & Kimlik Doğrulama
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hasta Kimlik & Acil Sağlık Bilgileri
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            İlaç hatırlatma ve acil durum SMS güvenliğiniz için lütfen kimlik ve medikal bilgilerinizi eksiksiz doldurunuz.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Row 1: TC Kimlik & Doğum Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                T.C. Kimlik Numarası <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={formData.tcKimlik}
                onChange={(e) => setFormData({ ...formData, tcKimlik: e.target.value.replace(/\D/g, "") })}
                placeholder="11 haneli T.C. Kimlik No"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Doğum Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Cinsiyet & Kan Grubu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cinsiyet
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer / Belirtmek İstemiyorum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kan Grubu <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as any })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-bold text-emerald-600 dark:text-emerald-400"
                required
              >
                <option value="">Kan Grubu Seçiniz</option>
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
          </div>

          {/* Row 3: Kronik Rahatsızlıklar & Alerjiler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kronik Rahatsızlıklar
              </label>
              <input
                type="text"
                value={formData.chronicDiseases}
                onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                placeholder="Örn: Tip 2 Diyabet, Tansiyon, Kalp"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                İlaç / Gıda Alerjileri
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Örn: Penisilin, Aspirin, Polen"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Acil Durum Yakını & Telefonu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Acil Durum Yakını Adı & Yakınlığı
              </label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Örn: Fatma Yılmaz (Eşi)"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Acil Durum Yakını Telefonu
              </label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="Örn: +905559876543"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 5: İl/İlçe & Açık Adres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                İl / İlçe
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Örn: İstanbul / Kadıköy"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Açık Adres (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Mahalle, Cadde, No"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white py-2"
              >
                Daha Sonra Tamamla
              </button>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-11 px-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20"
            >
              {loading ? "Kaydediliyor..." : "💾 Kimlik Bilgilerimi Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
