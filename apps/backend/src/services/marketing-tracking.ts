import {createHash} from 'node:crypto';

function sha256Hex(s: string): string {
  return createHash('sha256').update(s.trim().toLowerCase()).digest('hex');
}

function sha256Phone(digits: string): string {
  const normalized = digits.replace(/\D/g, '');
  return createHash('sha256').update(normalized).digest('hex');
}

export type MetaCapiForwardInput = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  email?: string;
  phone?: string;
  currency?: string;
  value?: number;
};

export async function forwardMetaCapi(input: MetaCapiForwardInput): Promise<{
  ok: boolean;
  status: number;
  body: unknown;
}> {
  const pixelId = process.env.META_PIXEL_ID;
  const token =
    process.env.META_CAPI_TOKEN ?? process.env.META_ACCESS_TOKEN ?? '';
  if (!pixelId || !token) {
    throw new Error(
      'META_PIXEL_ID and META_CAPI_TOKEN (or META_ACCESS_TOKEN) must be set',
    );
  }

  const user_data: Record<string, string[]> = {};
  if (input.email) {
    user_data.em = [sha256Hex(input.email)];
  }
  if (input.phone) {
    user_data.ph = [sha256Phone(input.phone)];
  }

  const row: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    event_source_url: input.eventSourceUrl,
    user_data,
  };

  if (input.value != null) {
    row.custom_data = {
      currency: input.currency ?? 'UYU',
      value: input.value,
    };
  }

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({data: [row]}),
  });
  const json = (await res.json()) as unknown;
  return {ok: res.ok, status: res.status, body: json};
}

export type TikTokForwardInput = {
  event: string;
  eventId: string;
  eventSourceUrl: string;
  timestamp?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
};

/**
 * TikTok Events API (pixel web). Payload shape may require tweaks per TikTok dashboard.
 */
export async function forwardTikTokEvent(
  input: TikTokForwardInput,
): Promise<{ok: boolean; status: number; body: unknown}> {
  const pixelCode = process.env.TIKTOK_PIXEL_CODE;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN ?? '';
  if (!pixelCode || !accessToken) {
    throw new Error('TIKTOK_PIXEL_CODE and TIKTOK_ACCESS_TOKEN must be set');
  }

  const context: Record<string, unknown> = {
    page: {
      url: input.eventSourceUrl,
    },
  };

  const user: Record<string, unknown> = {};
  if (input.email) {
    user.email = sha256Hex(input.email);
  }
  if (input.phone) {
    user.phone_number = sha256Phone(input.phone);
  }
  if (Object.keys(user).length > 0) {
    context.user = user;
  }

  const properties: Record<string, unknown> = {};
  if (input.value != null) {
    properties.value = input.value;
    properties.currency = input.currency ?? 'UYU';
  }

  const payload = {
    pixel_code: pixelCode,
    event: input.event,
    event_id: input.eventId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    context,
    ...(Object.keys(properties).length > 0 ? {properties} : {}),
  };

  const res = await fetch(
    'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    },
  );
  const json = (await res.json()) as unknown;
  return {ok: res.ok, status: res.status, body: json};
}
