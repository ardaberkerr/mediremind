import { smsLogsStorage } from "../storage/jsonStore";

export interface PersistentSmsLog {
  id: string;
  to: string;
  userName?: string;
  medicationName?: string;
  dosage?: string;
  message: string;
  provider: string;
  timestamp: string;
  status: "success" | "failed";
  error?: string;
}

const MAX_LOGS_LIMIT = 500; // Limit logs to prevent unbound memory consumption

export async function getSmsLogs(phoneFilter?: string): Promise<PersistentSmsLog[]> {
  try {
    const logs: PersistentSmsLog[] = await smsLogsStorage.read();
    if (phoneFilter) {
      const cleanFilter = phoneFilter.replace(/\D/g, "").slice(-10);
      return logs.filter((l) => {
        const cleanTo = l.to.replace(/\D/g, "").slice(-10);
        return cleanTo.includes(cleanFilter) || cleanFilter.includes(cleanTo);
      });
    }
    return logs;
  } catch (err) {
    console.error("[smsStorage] Read error:", err);
    return [];
  }
}

export async function addSmsLog(
  log: Omit<PersistentSmsLog, "timestamp"> & { timestamp?: string }
): Promise<PersistentSmsLog> {
  const newLog: PersistentSmsLog = {
    ...log,
    timestamp: log.timestamp || new Date().toLocaleString("tr-TR"),
  };

  await smsLogsStorage.update((logs: PersistentSmsLog[]) => {
    logs.unshift(newLog);
    // Keep within memory limit
    if (logs.length > MAX_LOGS_LIMIT) {
      return logs.slice(0, MAX_LOGS_LIMIT);
    }
    return logs;
  });

  return newLog;
}

export async function clearSmsLogs(): Promise<void> {
  await smsLogsStorage.write([]);
}
