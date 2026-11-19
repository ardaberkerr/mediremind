import { NextRequest, NextResponse } from "next/server";
import {
  getSmokingProfile,
  saveSmokingProfile,
  getCravingLogs,
  addCravingLog,
} from "@/lib/smoking/smokingStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const all = searchParams.get("all");

  if (all === "true") {
    const { getAllSmokingProfiles, getAllCravingLogs } = await import("@/lib/smoking/smokingStorage");
    const profiles = await getAllSmokingProfiles();
    const cravings = await getAllCravingLogs();
    return NextResponse.json({
      success: true,
      profiles,
      cravings,
    });
  }

  if (!userId) {
    return NextResponse.json({ error: "userId parametresi zorunludur" }, { status: 400 });
  }

  const profile = await getSmokingProfile(userId);
  const cravings = await getCravingLogs(userId);

  return NextResponse.json({
    success: true,
    profile,
    cravings,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "saveProfile") {
      const {
        userId,
        quitDate,
        cigarettesPerDay,
        pricePerPack,
        cigarettesPerPack = 20,
        yearsSmoked,
        motivationReason,
        savedMoneyGoal,
      } = body;

      if (!userId || !quitDate) {
        return NextResponse.json({ error: "userId ve quitDate zorunludur" }, { status: 400 });
      }

      const saved = await saveSmokingProfile({
        userId,
        quitDate,
        cigarettesPerDay: Number(cigarettesPerDay) || 15,
        pricePerPack: Number(pricePerPack) || 75,
        cigarettesPerPack: Number(cigarettesPerPack) || 20,
        yearsSmoked: yearsSmoked ? Number(yearsSmoked) : undefined,
        motivationReason,
        savedMoneyGoal,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, profile: saved });
    }

    if (action === "logCraving") {
      const { userId, intensity, trigger, notes, overcomeWith } = body;

      if (!userId) {
        return NextResponse.json({ error: "userId zorunludur" }, { status: 400 });
      }

      const craving = await addCravingLog({
        userId,
        intensity: Number(intensity) || 5,
        trigger: trigger || "Genel istek",
        notes,
        overcomeWith: overcomeWith || "Derin nefes egzersizi & Su",
      });

      return NextResponse.json({ success: true, craving });
    }

    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "İşlem sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
