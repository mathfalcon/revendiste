import {readFileSync} from 'node:fs';
import type {DraftInput, PublishMode} from './common';
import {appendPublishLog} from './publish-log';

const BASE = 'https://business-api.tiktok.com/open_api/v1.3';

function accessToken(): string {
  const t = process.env.TIKTOK_ACCESS_TOKEN;
  if (!t) {
    throw new Error('TIKTOK_ACCESS_TOKEN is not set');
  }
  return t;
}

function advertiserId(): string {
  const id = process.env.TIKTOK_ADVERTISER_ID;
  if (!id) {
    throw new Error('TIKTOK_ADVERTISER_ID is not set');
  }
  return id;
}

async function ttPost(path: string, body: Record<string, unknown>) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken(),
    },
    body: JSON.stringify({advertiser_id: advertiserId(), ...body}),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return {ok: res.ok, status: res.status, json};
}

/**
 * TikTok video upload is multi-step in production. v1 stub documents the flow.
 */
export async function tiktokPublishFromRender(
  input: DraftInput,
  mode: PublishMode,
): Promise<{note: string}> {
  void readFileSync(input.filePath);
  const {ok, status, json} = await ttPost('/file/video/ad/upload/', {
    upload_type: 'UPLOAD_BY_FILE',
    file_name: 'creative.mp4',
  });
  await appendPublishLog({
    platform: 'tiktok',
    httpStatus: status,
    requestPayload: {path: '/file/video/ad/upload/', kind: input.kind},
    responsePayload: json,
  });
  if (!ok) {
    throw new Error(
      `TikTok upload step failed: ${JSON.stringify((json as {message?: string}).message ?? json)}`,
    );
  }
  if (mode === 'launch') {
    throw new Error(
      'Full TikTok campaign launch is not implemented in v1 — use draft assets in TikTok Ads Manager.',
    );
  }
  return {
    note: 'TikTok Marketing API upload is partially stubbed; complete multipart upload in a follow-up.',
  };
}
