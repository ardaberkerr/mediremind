import { NextRequest, NextResponse } from "next/server";
import { addMedicationHistory, getMedicationHistory } from "@/lib/medications/historyStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId zorunludur" }, { status: 400 });
  }

  const history = await getMedicationHistory(userId);
  return NextResponse.json({ success: true, history });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, medicationName, dosage, scheduledTime, action, notes } = body;

    if (!userId || !medicationName || !action) {
      return NextResponse.json(
        { error: "Eksik parametreler" },
        { status: 400 }
      );
    }

    const log = await addMedicationHistory({
      userId,
      medicationName,
      dosage: dosage || "",
      scheduledTime: scheduledTime || "",
      action,
      notes,
    });

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Kayıt eklenemedi" },
      { status: 500 }
    );
  }
}
