import { NextRequest, NextResponse } from "next/server";
import { getSmsLogs, clearSmsLogs } from "@/lib/sms/smsStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone") || undefined;
  const role = searchParams.get("role") || "admin";

  // Eğer role admin ise veya phone belirtilmemişse tüm logları döndür, değilse sadece o kullanıcının loglarını döndür
  const logs = await (role === "admin" ? getSmsLogs() : getSmsLogs(phone));
  return NextResponse.json({ logs });
}

export async function DELETE() {
  const success = await clearSmsLogs();
  return NextResponse.json({ success });
}
