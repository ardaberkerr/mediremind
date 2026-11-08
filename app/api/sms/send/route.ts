import { NextRequest, NextResponse } from "next/server";
import { SmsService } from "@/lib/sms/smsService";
import { addSmsLog } from "@/lib/sms/smsStorage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, medicationName, dosage, notes, userName } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Telefon numarasi (to) zorunlu" },
        { status: 400 }
      );
    }

    const smsService = SmsService.getInstance();
    let result;
    let finalMessage = message;

    if (medicationName && dosage) {
      // Send medication reminder
      finalMessage = `❤️ İlaç Hatırlatma: ${medicationName} (${dosage}) alma zamanınız geldi!${
        notes ? `\nÖnemli: ${notes}` : ""
      }\n\nİyi günler dileriz – İlaç Hatırlatıcı`;
      result = await smsService.sendMedicationReminder(to, medicationName, dosage, notes);
    } else if (message) {
      // Send custom message
      result = await smsService.sendSms(to, message);
    } else {
      return NextResponse.json(
        { error: "message veya (medicationName + dosage) gerekli" },
        { status: 400 }
      );
    }

    // Otomatik olarak log kaydını ekle
    const savedLog = addSmsLog({
      id: result.messageId || `msg_${Date.now()}`,
      to,
      userName,
      medicationName: medicationName || undefined,
      dosage: dosage || undefined,
      message: finalMessage || "Mesaj içeriği yok",
      provider: result.provider,
      status: result.success ? "success" : "failed",
      error: result.error,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: result.provider,
        messageId: result.messageId,
        log: savedLog,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, log: savedLog },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[API /sms/send]", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const smsService = SmsService.getInstance();
  return NextResponse.json({
    status: "ok",
    provider: smsService.getActiveProvider(),
    mode: process.env.SMS_MODE || "demo",
  });
}

