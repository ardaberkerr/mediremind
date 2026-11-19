import { JsonFileStorage } from "../storage/jsonStore";

export interface SmokingProfile {
  userId: string;
  quitDate: string; // ISO Date string (e.g. "2026-11-19T10:00:00.000Z")
  cigarettesPerDay: number; // Günlük içilen sigara adedi
  pricePerPack: number; // Paket fiyatı (TL)
  cigarettesPerPack: number; // Paketteki dal sayısı (genelde 20)
  yearsSmoked?: number; // Kaç yıldır içtiği
  motivationReason?: string; // Bırakma motivasyonu (örn: Çocuklarım, Sağlığım, Spor)
  savedMoneyGoal?: string; // Biriktirilen parayla alınacak hedef (örn: Tatil, Telefon)
  updatedAt: string;
}

export interface CravingLog {
  id: string;
  userId: string;
  timestamp: string; // ISO Date string
  intensity: number; // 1-10 arası kriz şiddeti
  trigger?: string; // Tetikleyici (örn: Stres, Kahve, Yemek sonrası, Sosyal ortam)
  notes?: string;
  overcomeWith?: string; // Nasıl atlattı? (örn: Su içtim, Derin nefes aldım, Yürüyüş yaptım)
}

export const smokingProfileStorage = new JsonFileStorage<SmokingProfile>("smoking_profiles.json");
export const cravingLogsStorage = new JsonFileStorage<CravingLog>("smoking_cravings.json");

export async function getSmokingProfile(userId: string): Promise<SmokingProfile | null> {
  const all = await smokingProfileStorage.read();
  return all.find((p) => p.userId === userId) ?? null;
}

export async function saveSmokingProfile(profile: SmokingProfile): Promise<SmokingProfile> {
  await smokingProfileStorage.update((profiles: SmokingProfile[]) => {
    const idx = profiles.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) {
      profiles[idx] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      profiles.push({ ...profile, updatedAt: new Date().toISOString() });
    }
    return profiles;
  });
  return profile;
}

export async function addCravingLog(log: Omit<CravingLog, "id" | "timestamp">): Promise<CravingLog> {
  const newLog: CravingLog = {
    ...log,
    id: `crav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  await cravingLogsStorage.update((logs: CravingLog[]) => {
    logs.unshift(newLog);
    return logs.slice(0, 500); // 500 log sınırı
  });

  return newLog;
}

export async function getCravingLogs(userId: string): Promise<CravingLog[]> {
  const all = await cravingLogsStorage.read();
  return all.filter((l) => l.userId === userId);
}
