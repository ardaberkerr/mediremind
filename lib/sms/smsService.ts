import twilio from "twilio";

// --- Interfaces ---
export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

interface SmsProvider {
  name: string;
  send(to: string, body: string): Promise<SmsResult>;
}

// --- Demo Provider (console log only) ---
class DemoProvider implements SmsProvider {
  name = "demo";

  async send(to: string, body: string): Promise<SmsResult> {
    const messageId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log("\n========== SMS DEMO ==========");
    console.log(`To:      ${to}`);
    console.log(`Body:    ${body}`);
    console.log(`MsgID:   ${messageId}`);
    console.log(`Time:    ${new Date().toLocaleString("tr-TR")}`);
    console.log("==============================\n");
    return { success: true, provider: "demo", messageId };
  }
}

// --- Twilio Provider ---
class TwilioProvider implements SmsProvider {
  name = "twilio";
  private client;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async send(to: string, body: string): Promise<SmsResult> {
    try {
      const message = await this.client.messages.create({
        from: this.fromNumber,
        to,
        body,
      });
      return { success: true, provider: "twilio", messageId: message.sid };
    } catch (err: any) {
      return { success: false, provider: "twilio", error: err.message };
    }
  }
}

// --- NetGSM Provider ---
class NetgsmProvider implements SmsProvider {
  name = "netgsm";
  private username: string;
  private password: string;
  private sender: string;

  constructor(username: string, password: string, sender: string) {
    this.username = username;
    this.password = password;
    this.sender = sender;
  }

  async send(to: string, body: string): Promise<SmsResult> {
    try {
      const url = new URL("https://api.netgsm.com.tr/sms/send/get");
      url.searchParams.append("usercode", this.username);
      url.searchParams.append("password", this.password);
      url.searchParams.append("gsmno", to.replace("+", ""));
      url.searchParams.append("message", body);
      url.searchParams.append("msgheader", this.sender);

      const res = await fetch(url.toString(), { method: "GET" });
      const text = await res.text();
      const code = text.split(" ")[0];

      if (["00", "01", "02"].includes(code)) {
        return { success: true, provider: "netgsm", messageId: text };
      }
      return { success: false, provider: "netgsm", error: `NetGSM error code: ${code}` };
    } catch (err: any) {
      return { success: false, provider: "netgsm", error: err.message };
    }
  }
}

// --- SmsService (singleton) ---
export class SmsService {
  private providers: SmsProvider[] = [];
  private static instance: SmsService;

  constructor() {
    // Always add demo provider as fallback
    const mode = process.env.SMS_MODE || "demo";

    if (mode === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (sid && token && from) {
        this.providers.push(new TwilioProvider(sid, token, from));
      }
    }

    if (mode === "netgsm") {
      const user = process.env.NETGSM_USERNAME;
      const pass = process.env.NETGSM_PASSWORD;
      const sender = process.env.NETGSM_SENDER_ID;
      if (user && pass && sender) {
        this.providers.push(new NetgsmProvider(user, pass, sender));
      }
    }

    // Fallback: demo provider
    if (this.providers.length === 0) {
      this.providers.push(new DemoProvider());
    }
  }

  static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  getActiveProvider(): string {
    return this.providers[0]?.name || "none";
  }

  async sendSms(to: string, body: string): Promise<SmsResult> {
    for (const provider of this.providers) {
      const result = await provider.send(to, body);
      if (result.success) return result;
      console.error(`[SMS] ${provider.name} failed:`, result.error);
    }
    return { success: false, provider: "all", error: "All SMS providers failed" };
  }

  async sendMedicationReminder(
    to: string,
    medicationName: string,
    dosage: string,
    notes?: string
  ): Promise<SmsResult> {
    let body = `❤️ İlaç Hatırlatma: ${medicationName} (${dosage}) alma zamanınız geldi!`;
    if (notes) body += `\nÖnemli: ${notes}`;
    body += "\n\nİyi günler dileriz – İlaç Hatırlatıcı";
    return this.sendSms(to, body);
  }
}
