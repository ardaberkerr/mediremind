import { JsonFileStorage } from "../storage/jsonStore";

export interface MedicationHistoryLog {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  action: "taken" | "skipped";
  timestamp: string; // ISO string
  notes?: string;
}

export const medicationHistoryStorage = new JsonFileStorage<MedicationHistoryLog>("medication_history.json");

export async function addMedicationHistory(
  entry: Omit<MedicationHistoryLog, "id" | "timestamp">
): Promise<MedicationHistoryLog> {
  const newEntry: MedicationHistoryLog = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  await medicationHistoryStorage.update((logs: MedicationHistoryLog[]) => {
    logs.unshift(newEntry);
    if (logs.length > 500) {
      return logs.slice(0, 500);
    }
    return logs;
  });

  return newEntry;
}

export async function getMedicationHistory(userId: string): Promise<MedicationHistoryLog[]> {
  const all = await medicationHistoryStorage.read();
  return all.filter((l) => l.userId === userId);
}
