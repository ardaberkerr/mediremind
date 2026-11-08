import { NextResponse } from "next/server";
import { SmsService } from "@/lib/sms/smsService";
import { addSmsLog } from "@/lib/sms/smsStorage";

export async function POST() {
  const smsService = SmsService.getInstance();
  const to = "+905551234567";
  const medName = "Aspirin";
  const dosage = "500 mg";
  const notes = "Yemeklerden sonra aliniz.";

  const result = await smsService.sendMedicationReminder(to, medName, dosage, notes);

  const savedLog = addSmsLog({
    id: result.messageId || `test_${Date.now()}`,
    to,
    message: `❤️ İlaç Hatırlatma: ${medName} (${dosage}) alma zamanınız geldi!\nÖnemli: ${notes}\n\nİyi günler dileriz – İlaç Hatırlatıcı`,
    provider: result.provider,
    status: result.success ? "success" : "failed",
    error: result.error,
  });

  return NextResponse.json({
    testResult: result,
    activeProvider: smsService.getActiveProvider(),
    timestamp: new Date().toISOString(),
    log: savedLog,
  });
}

