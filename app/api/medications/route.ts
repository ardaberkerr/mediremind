import { NextResponse } from "next/server";
import { getAllMedications, saveMedication, deleteMedication } from "@/lib/medications/medicationStorage";
import { startReminderScheduler, checkAndSendDueReminders } from "@/lib/scheduler/reminderScheduler";
import { SmsService } from "@/lib/sms/smsService";

// Ensure scheduler starts on first API call
startReminderScheduler();

export async function GET() {
  const medications = await getAllMedications();
  return NextResponse.json({ success: true, medications });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, dosage, reminderTime, notes, phone, userId, userName } = body;

    if (!name || !dosage || !reminderTime || !phone) {
      return NextResponse.json(
        { success: false, error: "İlaç adı, dozaj, hatırlatma saati ve telefon zorunludur." },
        { status: 400 }
      );
    }

    // 1. Save persistent schedule
    const newMed = await saveMedication({
      name,
      dosage,
      reminderTime,
      notes,
      phone,
      userId: userId ? String(userId) : undefined,
      userName,
    });

    // İlaç kaydedildiğinde anında SMS veya bildirim atılmaz.
    // Sadece saati geldiğinde otomatik tetiklenir.

    return NextResponse.json({ success: true, medication: newMed });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "İlaç kaydı oluşturulamadı." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID gerekli" }, { status: 400 });
    }
    const success = await deleteMedication(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
