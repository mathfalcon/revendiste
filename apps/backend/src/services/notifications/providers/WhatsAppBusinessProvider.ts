import {logger} from '~/utils';
import type {IWhatsAppProvider, WhatsAppTemplateComponent} from './IWhatsAppProvider';
import {
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_API_VERSION,
} from '~/config/env';

/** WhatsApp Cloud API: 80 messages/second per phone number. We throttle conservatively. */
const RATE_LIMIT_PER_SECOND = 10;
const WINDOW_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * WhatsApp Business API Provider
 *
 * Sends messages via the Meta WhatsApp Cloud API (graph.facebook.com).
 * Only template messages are supported (business-initiated).
 *
 * Setup:
 * 1. Create a Meta Business account
 * 2. Set up WhatsApp Business API in Meta Business Suite
 * 3. Register and verify a phone number
 * 4. Create message templates and get them approved
 * 5. Create a System User and generate a permanent access token
 * 6. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars
 */
export class WhatsAppBusinessProvider implements IWhatsAppProvider {
  private recentSendTimes: number[] = [];

  constructor() {
    if (!WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID is required for WhatsAppBusinessProvider.',
      );
    }
    if (!WHATSAPP_ACCESS_TOKEN) {
      throw new Error(
        'WHATSAPP_ACCESS_TOKEN is required for WhatsAppBusinessProvider.',
      );
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.recentSendTimes = this.recentSendTimes.filter(
      t => now - t < WINDOW_MS,
    );
    if (this.recentSendTimes.length >= RATE_LIMIT_PER_SECOND) {
      const oldest = this.recentSendTimes[0]!;
      const waitMs = oldest + WINDOW_MS - now;
      if (waitMs > 0) {
        await sleep(waitMs);
        return this.throttle();
      }
    }
    this.recentSendTimes.push(Date.now());
  }

  async sendMessage(params: {
    to: string;
    templateName: string;
    templateLanguage: string;
    components?: WhatsAppTemplateComponent[];
  }): Promise<void> {
    await this.throttle();

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: {code: params.templateLanguage},
        ...(params.components?.length && {components: params.components}),
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('WhatsApp API error', {
        status: response.status,
        body: errorBody,
        to: params.to,
        template: params.templateName,
      });
      throw new Error(
        `WhatsApp API error (${response.status}): ${errorBody}`,
      );
    }

    const result = (await response.json()) as {messages?: Array<{id: string}>};

    logger.info('WhatsApp message sent', {
      messageId: result.messages?.[0]?.id,
      to: params.to,
      template: params.templateName,
    });
  }
}
