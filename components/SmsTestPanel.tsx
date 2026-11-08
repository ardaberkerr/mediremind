"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SmsTestResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

export default function SmsTestPanel() {
  const [phone, setPhone] = useState("+905551234567");
  const [message, setMessage] = useState("Test SMS mesaji - Ilac Hatirlatici");
  const [result, setResult] = useState<SmsTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState<string | null>(null);

  async function checkProvider() {
    try {
      const res = await fetch("/api/sms/send");
      const data = await res.json();
      setProviderInfo(`Aktif: ${data.provider} (${data.mode} modu)`);
    } catch {
      setProviderInfo("Provider kontrol edilemedi");
    }
  }

  async function sendTestSms() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function sendReminderTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sms/test", { method: "POST" });
      const data = await res.json();
      setResult(data.testResult);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={checkProvider} type="button">
          Provider Kontrol
        </Button>
        {providerInfo && (
          <span className="text-sm text-gray-600">{providerInfo}</span>
        )}
      </div>

      <div className="grid gap-3">
        <div>
          <label className="text-sm font-medium">Telefon Numarasi</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+905551234567"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Mesaj</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="SMS metni..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={sendTestSms} disabled={loading} type="button">
          {loading ? "Gonderiliyor..." : "Ozel SMS Gonder"}
        </Button>
        <Button onClick={sendReminderTest} disabled={loading} variant="outline" type="button">
          {loading ? "Gonderiliyor..." : "Ornek Hatirlama Gonder"}
        </Button>
      </div>

      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.success
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="font-semibold">
            {result.success ? "Basarili!" : "Hata!"}
          </p>
          {result.provider && <p>Provider: {result.provider}</p>}
          {result.messageId && <p>Mesaj ID: {result.messageId}</p>}
          {result.error && <p>Hata: {result.error}</p>}
        </div>
      )}
    </div>
  );
}
