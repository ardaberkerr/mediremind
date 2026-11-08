import { getAllMedications, updateMedication } from "@/lib/medications/medicationStorage";
import { getAllPushSubscriptions, deletePushSubscription } from "@/lib/notifications/pushStorage";
import { SmsService } from "@/lib/sms/smsService";
import webpush from "web-push";

// Optional VAPID configuration if keys exist, fallback to silent log if not set
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(
      "mailto:support@mediremind.com",
      publicVapidKey,
      privateVapidKey
    );
  } catch (err) {
    console.error("[Scheduler] VAPID configuration error:", err);
  }
}

let schedulerTimer: NodeJS.Timeout | null = null;

export async function checkAndSendDueReminders() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;
  const todayStr = now.toISOString().split("T")[0];

  const allMeds = await getAllMedications();
  const dueMeds = allMeds.filter((m) => {
    return m.reminderTime === currentTime && m.lastNotifiedDate !== todayStr;
  });

  if (dueMeds.length === 0) return;

  const pushSubs = await getAllPushSubscriptions();

  for (const med of dueMeds) {
    console.log(
      `[Scheduler] ⏰ Reminder triggered for ${med.name} (${med.dosage}) to ${med.phone} at ${currentTime}`
    );

    // Update last notified date to prevent multiple alerts within the same minute
    await updateMedication(med.id, { lastNotifiedDate: todayStr });

    // 1. Send SMS Notification
    try {
      await SmsService.getInstance().sendMedicationReminder(
        med.phone,
        med.name,
        med.dosage,
        med.notes
      );
    } catch (err) {
      console.error("[Scheduler] Error sending SMS:", err);
    }

    // 2. Send Web Push Notification to background Service Worker
    if (publicVapidKey && privateVapidKey && pushSubs.length > 0) {
      const payload = JSON.stringify({
        title: `💊 İlaç Saati: ${med.name}`,
        body: `Doz: ${med.dosage}. ${
          med.notes ? "Not: " + med.notes : "Lütfen ilacınızı almayı unutmayın!"
        }`,
        url: `/?medName=${encodeURIComponent(med.name)}&medDosage=${encodeURIComponent(
          med.dosage
        )}&medTime=${encodeURIComponent(med.reminderTime)}&medNotes=${encodeURIComponent(
          med.notes || ""
        )}`,
        medication: {
          name: med.name,
          dosage: med.dosage,
          reminderTime: med.reminderTime,
          notes: med.notes || "",
        },
        timestamp: Date.now(),
      });

      for (const sub of pushSubs) {
        if (!med.userId || !sub.userId || med.userId === sub.userId) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys,
              },
              payload
            );
          } catch (pushErr: any) {
            console.error("[Scheduler] Push send error:", pushErr?.message);
            // If subscription is expired or unsubscribed (410 / 404), purge it
            if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
              await deletePushSubscription(sub.endpoint);
            }
          }
        }
      }
    }
  }
}

export function startScheduler() {
  if (schedulerTimer) return;
  console.log(
    "[Scheduler] 🚀 Starting Server-Side Medication Reminder Scheduler (Checking every 30s)..."
  );
  checkAndSendDueReminders();
  schedulerTimer = setInterval(checkAndSendDueReminders, 30000);
}

export const startReminderScheduler = startScheduler;

export function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
