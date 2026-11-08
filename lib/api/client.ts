import { StoredUser, UserIdentityInfo } from "@/lib/auth/userStorage";

export interface SendSmsPayload {
  to: string;
  message?: string;
  medicationName?: string;
  dosage?: string;
  notes?: string;
}

export interface SmsLogItem {
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

async function safeJsonParse(res: Response) {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn("[safeJsonParse] Invalid JSON response:", text);
    return { error: "Sunucudan geçersiz yanıt alındı." };
  }
}

// --- Auth API ---

export async function apiLogin(phone: string, password?: string): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
  const res = await fetch("/api/auth/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", phone, password }),
  });
  return safeJsonParse(res);
}

export async function apiRegister(
  name: string,
  phone: string,
  password: string,
  email?: string,
  identityInfo?: UserIdentityInfo
): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
  const res = await fetch("/api/auth/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", name, phone, password, email, identityInfo }),
  });
  return safeJsonParse(res);
}

export async function apiUpdateUser(id: string, updates: Partial<StoredUser>): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
  const res = await fetch("/api/auth/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  });
  return safeJsonParse(res);
}

export async function apiFetchAllUsers(): Promise<StoredUser[]> {
  try {
    const res = await fetch("/api/auth/users");
    const data = await safeJsonParse(res);
    return Array.isArray(data.users) ? data.users : [];
  } catch (err) {
    console.error("[apiFetchAllUsers]", err);
    return [];
  }
}

// --- SMS API ---

export async function sendSms(payload: SendSmsPayload) {
  const res = await fetch("/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJsonParse(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || "SMS gönderimi başarısız oldu.");
  }
  return data;
}

export async function sendTestSms() {
  const res = await fetch("/api/sms/test", {
    method: "POST",
  });
  const data = await safeJsonParse(res);
  if (!res.ok) {
    throw new Error(data.error || "Test SMS gönderilemedi.");
  }
  return data;
}

export async function getSmsStatus() {
  try {
    const res = await fetch("/api/sms/send");
    const data = await safeJsonParse(res);
    return data && data.status ? data : { status: "ok", provider: "demo", mode: "demo" };
  } catch {
    return { status: "offline", provider: "none", mode: "demo" };
  }
}

export async function fetchSmsLogs(phone?: string, role: string = "admin"): Promise<SmsLogItem[]> {
  try {
    const params = new URLSearchParams();
    if (phone) params.set("phone", phone);
    if (role) params.set("role", role);
    const res = await fetch(`/api/sms/logs?${params.toString()}`);
    const data = await safeJsonParse(res);
    return Array.isArray(data.logs) ? data.logs : [];
  } catch (err) {
    console.error("[fetchSmsLogs]", err);
    return [];
  }
}

export async function clearAllSmsLogs(): Promise<boolean> {
  try {
    const res = await fetch("/api/sms/logs", { method: "DELETE" });
    const data = await safeJsonParse(res);
    return !!data.success;
  } catch (err) {
    console.error("[clearAllSmsLogs]", err);
    return false;
  }
}

export async function createMedication(data: Record<string, unknown>) {
  console.log("[Client] Saving medication & sending SMS reminder:", data);
  const response = await sendSms({
    to: (data.phone as string) || "+905551234567",
    medicationName: data.name as string,
    dosage: data.dosage as string,
    notes: data.notes as string,
  });
  return response;
}

/**
 * PC / Tarayıcı üzerinde sesli bildirim çalar
 */
export function playNotificationChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // Play a dual-tone chime (Medical Reminder Melody: E5 -> G5 -> C6)
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };

    playTone(659.25, 0.0, 0.25); // E5
    playTone(783.99, 0.22, 0.25); // G5
    playTone(1046.50, 0.44, 0.45); // C6
  } catch (e) {
    console.warn("Web Audio API notification error:", e);
  }
}

/**
 * PC Bildirim Merkezi (Windows Toast / Native Notification) tetikler
 */
export function showDesktopNotification(title: string, body: string) {
  playNotificationChime();

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch {}
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          try {
            new Notification(title, {
              body,
              icon: "/favicon.ico",
            });
          } catch {}
        }
      });
    }
  }
}
