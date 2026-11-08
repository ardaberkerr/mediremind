import { medicationsStorage } from "../storage/jsonStore";

export interface ScheduledMedication {
  id: string;
  userId?: string;
  userName?: string;
  phone: string;
  name: string;
  dosage: string;
  reminderTime: string; // "HH:mm"
  notes?: string;
  createdAt: string;
  lastNotifiedDate?: string; // "YYYY-MM-DD"
}

export async function getAllMedications(): Promise<ScheduledMedication[]> {
  try {
    return await medicationsStorage.read();
  } catch (err) {
    console.error("[medicationStorage] Error reading file:", err);
    return [];
  }
}

export async function saveMedication(
  med: Omit<ScheduledMedication, "id" | "createdAt">
): Promise<ScheduledMedication> {
  const newMed: ScheduledMedication = {
    ...med,
    id: "med_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  await medicationsStorage.update((list: ScheduledMedication[]) => {
    list.unshift(newMed);
    return list;
  });

  return newMed;
}

export async function updateMedication(
  id: string,
  updates: Partial<ScheduledMedication>
): Promise<ScheduledMedication | null> {
  let updated: ScheduledMedication | null = null;
  await medicationsStorage.update((list: ScheduledMedication[]) => {
    const idx = list.findIndex((m) => m.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, id };
      updated = list[idx];
    }
    return list;
  });
  return updated;
}

export async function deleteMedication(id: string): Promise<boolean> {
  let removed = false;
  await medicationsStorage.update((list: ScheduledMedication[]) => {
    const initialLen = list.length;
    const filtered = list.filter((m) => m.id !== id);
    if (filtered.length !== initialLen) {
      removed = true;
    }
    return filtered;
  });
  return removed;
}
