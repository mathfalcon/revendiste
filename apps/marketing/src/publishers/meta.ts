import {readFileSync} from 'node:fs';
import type {DraftInput, PublishMode} from './common';
import {appendPublishLog} from './publish-log';

const GRAPH = 'https://graph.facebook.com/v21.0';

function token(): string {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) {
    throw new Error('META_ACCESS_TOKEN is not set');
  }
  return t;
}

function adAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) {
    throw new Error('META_AD_ACCOUNT_ID is not set (use act_...)');
  }
  return id;
}

async function graphPost(path: string, body: Record<string, unknown>) {
  const url = `${GRAPH}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...body, access_token: token()}),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return {ok: res.ok, status: res.status, json};
}

/**
 * Uploads a video to the ad account and returns video id.
 */
export async function metaUploadVideo(localPath: string): Promise<string> {
  const buf = readFileSync(localPath);
  const form = new FormData();
  form.append('access_token', token());
  form.append('source', new Blob([buf]), 'video.mp4');

  const url = `${GRAPH}/${adAccountId()}/advideos`;
  const res = await fetch(url, {method: 'POST', body: form});
  const json = (await res.json()) as {id?: string; error?: {message: string}};
  if (!res.ok || !json.id) {
    throw new Error(
      `Meta video upload failed: ${json.error?.message ?? res.statusText}`,
    );
  }
  return json.id;
}

/**
 * Creates an ad creative in draft-like state (creative only; no campaign spend).
 */
export async function metaCreateVideoCreative(input: {
  name: string;
  videoId: string;
  message: string;
}): Promise<{creativeId: string; adsManagerUrl: string}> {
  const {ok, status, json} = await graphPost(`/${adAccountId()}/adcreatives`, {
    name: input.name,
    object_story_spec: {
      page_id: process.env.META_PAGE_ID,
      video_data: {
        video_id: input.videoId,
        message: input.message,
      },
    },
  });
  await appendPublishLog({
    platform: 'meta',
    httpStatus: status,
    requestPayload: {path: 'adcreatives', name: input.name},
    responsePayload: json,
  });
  if (!ok) {
    throw new Error(
      `Meta adcreative failed: ${(json as {error?: {message: string}}).error?.message ?? status}`,
    );
  }
  const id = (json as {id?: string}).id;
  if (!id) {
    throw new Error('Meta adcreative: missing id in response');
  }
  const url = `https://business.facebook.com/adsmanager/`;
  return {creativeId: id, adsManagerUrl: url};
}

export async function metaPublishFromRender(
  input: DraftInput,
  mode: PublishMode,
): Promise<{creativeId?: string; adsManagerUrl: string}> {
  if (input.kind !== 'video') {
    throw new Error('Meta publisher v1 only supports video');
  }
  const videoId = await metaUploadVideo(input.filePath);
  const {creativeId, adsManagerUrl} = await metaCreateVideoCreative({
    name: input.name,
    videoId,
    message: 'Revendiste',
  });
  if (mode === 'launch') {
    throw new Error(
      'Full Meta campaign launch is not implemented in v1 — use draft and launch in Ads Manager.',
    );
  }
  return {creativeId, adsManagerUrl};
}
