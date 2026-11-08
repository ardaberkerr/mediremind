import { NextResponse } from "next/server";
import { savePushSubscription } from "@/lib/notifications/pushStorage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: "Geçersiz push abonelik verisi." },
        { status: 400 }
      );
    }

    const saved = await savePushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId,
    });

    return NextResponse.json({ success: true, subscription: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Abonelik kaydedilemedi." },
      { status: 500 }
    );
  }
}
