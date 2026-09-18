import twilio from 'twilio';
import { env } from '@/env.mjs';

interface SmsProvider {
  send(to: string, body: string): Promise<void>;
}

class TwilioProvider implements SmsProvider {
  private client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  async send(to: string, body: string): Promise<void> {
    await this.client.messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
  }
}

class NetgsmProvider implements SmsProvider {
  private username = env.NETGSM_USERNAME;
  private password = env.NETGSM_PASSWORD;
  private sender = env.NETGSM_SENDER_ID;

  async send(to: string, body: string): Promise<void> {
    const url = new URL('https://api.netgsm.com.tr/sms/send/datatag');
    url.searchParams.append('usercode', this.username);
    url.searchParams.append('password', this.password);
    url.searchParams.append('gsmno', to.replace('+', ''));
    url.searchParams.append('message', body);
    url.searchParams.append('msgheader', this.sender);
    await fetch(url.toString(), { method: 'GET' });
  }
}

export class SmsService {
  private providers: SmsProvider[];

  constructor() {
    this.providers = [];
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      this.providers.push(new TwilioProvider());
    }
    if (env.NETGSM_USERNAME && env.NETGSM_PASSWORD && env.NETGSM_SENDER_ID) {
      this.providers.push(new NetgsmProvider());
    }
    if (this.providers.length === 0) {
      throw new Error('No SMS provider configured');
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    // Try providers sequentially until one succeeds
    for (const provider of this.providers) {
      try {
        await provider.send(to, body);
        return;
      } catch (e) {
        console.error('SMS provider failed', e);
        // continue to next provider
      }
    }
    throw new Error('All SMS providers failed');
  }
}
