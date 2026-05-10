import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import type {Insertable} from 'kysely';
import type {CampaignsTable} from '../db/types';
import {db} from '../db/index';
import type {DraftInput, PublishMode} from './common';
import type {UnifiedPublishPlan} from './planner';
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

function identityId(): string {
  const id = process.env.TIKTOK_IDENTITY_ID;
  if (!id) {
    throw new Error(
      'TIKTOK_IDENTITY_ID is not set (Business Center identity / authorized TikTok account)',
    );
  }
  return id;
}

async function ttPost(path: string, body: Record<string, unknown>) {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken(),
    },
    body: JSON.stringify({advertiser_id: advertiserId(), ...body}),
  });
  const json = (await res.json()) as Record<string, unknown> & {
    code?: number;
    message?: string;
  };
  return {ok: res.ok && json.code === 0, status: res.status, json};
}

async function log(
  campaignId: string | undefined,
  path: string,
  req: unknown,
  res: Record<string, unknown>,
  httpStatus: number,
): Promise<void> {
  await appendPublishLog({
    campaignId: campaignId ?? null,
    platform: 'tiktok',
    httpStatus,
    requestPayload: {path, body: req},
    responsePayload: res,
  });
}

export async function tiktokUploadVideo(localPath: string): Promise<string> {
  const buf = readFileSync(localPath);
  const signature = createHash('md5').update(buf).digest('hex');
  const form = new FormData();
  form.append('advertiser_id', advertiserId());
  form.append('upload_type', 'UPLOAD_BY_FILE');
  form.append('video_signature', signature);
  form.append('video_file', new Blob([buf]), 'creative.mp4');

  const url = `${BASE}/file/video/ad/upload/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Access-Token': accessToken()},
    body: form,
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {video_id?: string};
  };
  await appendPublishLog({
    platform: 'tiktok',
    httpStatus: res.status,
    requestPayload: {
      path: '/file/video/ad/upload/',
      upload_type: 'UPLOAD_BY_FILE',
    },
    responsePayload: json as Record<string, unknown>,
  });
  if (!res.ok || json.code !== 0 || !json.data?.video_id) {
    throw new Error(
      `TikTok video upload failed: ${json.message ?? res.statusText} ${JSON.stringify(json)}`,
    );
  }
  return json.data.video_id;
}

export async function tiktokPublishFromPlan(
  plan: UnifiedPublishPlan,
  opts: {dryRun: boolean},
): Promise<{
  dryRun: boolean;
  campaignRowId?: string;
  tiktokCampaignId?: string;
  adGroupId?: string;
  adId?: string;
  adsManagerUrl: string;
  preview?: Record<string, unknown>;
}> {
  const adsManagerUrl = 'https://ads.tiktok.com/';
  const locIds = (plan.tiktok.targeting.location_ids ?? []) as string[];
  if (!opts.dryRun && locIds.length === 0) {
    throw new Error(
      'TikTok targeting has no location_ids — set TIKTOK_LOCATION_UY_ID (or TIKTOK_LOCATION_UY_IDS).',
    );
  }

  if (opts.dryRun) {
    return {
      dryRun: true,
      adsManagerUrl,
      preview: {
        campaign: {
          campaign_name: plan.campaignName,
          objective_type: plan.tiktok.tiktokObjective,
          budget_mode: 'BUDGET_MODE_INFINITE',
          operation_status: 'DISABLE',
        },
        adGroup: {
          adgroup_name: plan.tiktok.adGroupName,
          budget_mode: 'BUDGET_MODE_DAY',
          budget: plan.dailyBudgetUsd,
          audience: plan.tiktok.targeting,
        },
        ad: {
          landing_page_url: plan.linkUrlTiktok,
          ad_text: plan.primaryText,
        },
      },
    };
  }

  const insert: Insertable<CampaignsTable> = {
    renderId: plan.renderId,
    platform: 'tiktok',
    mode: 'draft',
    status: 'publishing',
    budgetUsd: plan.dailyBudgetUsd,
    targeting: plan.tiktok.targeting as Record<string, unknown>,
    externalIds: {},
    name: plan.campaignName,
    objective: plan.tiktok.tiktokObjective,
    destinationUrl: plan.linkUrlTiktok,
    utm: plan.utmByPlatform.tiktok as Record<string, unknown>,
    pausedAt: null,
    createdAt: new Date(),
  };

  const row = await db
    .insertInto('campaigns')
    .values(insert)
    .returningAll()
    .executeTakeFirstOrThrow();

  const cid = row.id;

  try {
    const videoId = await tiktokUploadVideo(plan.filePath);

    const campBody = {
      campaign_name: plan.campaignName,
      objective_type: plan.tiktok.tiktokObjective,
      budget_mode: 'BUDGET_MODE_INFINITE',
      operation_status: 'DISABLE',
    };
    const campRes = await ttPost('/campaign/create/', campBody);
    await log(cid, '/campaign/create/', campBody, campRes.json, campRes.status);
    if (!campRes.ok) {
      throw new Error(
        `TikTok campaign: ${(campRes.json as {message?: string}).message ?? campRes.status}`,
      );
    }
    const tiktokCampaignId = String(
      (campRes.json as {data?: {campaign_id?: string}}).data?.campaign_id ?? '',
    );
    if (!tiktokCampaignId) {
      throw new Error('TikTok campaign: missing campaign_id');
    }

    const audience = {...plan.tiktok.targeting} as Record<string, unknown>;

    const adGroupBody = {
      campaign_id: tiktokCampaignId,
      adgroup_name: plan.tiktok.adGroupName,
      budget_mode: 'BUDGET_MODE_DAY',
      budget: plan.dailyBudgetUsd,
      schedule_type: 'SCHEDULE_FROM_NOW',
      optimization_goal: 'CLICK',
      billing_event: 'CPC',
      placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
      promotion_type: 'WEBSITE',
      audience,
      operation_status: 'DISABLE',
      bid_type: 'BID_TYPE_NO_BID',
      pixel_id: process.env.TIKTOK_PIXEL_CODE ?? undefined,
    };

    const agRes = await ttPost('/adgroup/create/', adGroupBody);
    await log(cid, '/adgroup/create/', adGroupBody, agRes.json, agRes.status);
    if (!agRes.ok) {
      throw new Error(
        `TikTok ad group: ${(agRes.json as {message?: string}).message ?? agRes.status}`,
      );
    }
    const adGroupId = String(
      (agRes.json as {data?: {adgroup_id?: string}}).data?.adgroup_id ?? '',
    );
    if (!adGroupId) {
      throw new Error('TikTok ad group: missing adgroup_id');
    }

    const adBody = {
      adgroup_id: adGroupId,
      creatives: [
        {
          ad_format: 'SINGLE_VIDEO',
          video_id: videoId,
          ad_name: `${plan.campaignName} — ad`,
          ad_text: plan.primaryText,
          call_to_action: 'LEARN_MORE',
          landing_page_url: plan.linkUrlTiktok,
          identity_type: 'TT_USER',
          identity_id: identityId(),
        },
      ],
      operation_status: 'DISABLE',
    };

    const adRes = await ttPost('/ad/create/', adBody);
    await log(cid, '/ad/create/', adBody, adRes.json, adRes.status);
    if (!adRes.ok) {
      throw new Error(
        `TikTok ad: ${(adRes.json as {message?: string}).message ?? adRes.status}`,
      );
    }
    const adId = String(
      (adRes.json as {data?: {ad_ids?: string[]}}).data?.ad_ids?.[0] ?? '',
    );

    await db
      .updateTable('campaigns')
      .set({
        status: 'paused',
        pausedAt: new Date(),
        externalIds: {
          campaignId: tiktokCampaignId,
          adGroupId,
          adId,
          videoId,
        } as Record<string, unknown>,
      })
      .where('id', '=', cid)
      .execute();

    return {
      dryRun: false,
      campaignRowId: cid,
      tiktokCampaignId,
      adGroupId,
      adId,
      adsManagerUrl,
    };
  } catch (e) {
    await db
      .updateTable('campaigns')
      .set({status: 'failed'})
      .where('id', '=', cid)
      .execute();
    throw e;
  }
}

export async function tiktokPublishFromRender(
  input: DraftInput,
  mode: PublishMode,
): Promise<{videoId: string}> {
  void mode;
  if (input.kind !== 'video') {
    throw new Error('TikTok publisher only supports video');
  }
  if (mode === 'launch') {
    throw new Error(
      'Launch mode is disabled — use PAUSED campaign creation via tiktokPublishFromPlan.',
    );
  }
  const videoId = await tiktokUploadVideo(input.filePath);
  return {videoId};
}
