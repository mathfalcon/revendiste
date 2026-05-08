import {readFileSync} from 'node:fs';
import type {Insertable} from 'kysely';
import type {CampaignsTable} from '../db/types';
import {db} from '../db/index';
import type {DraftInput, PublishMode} from './common';
import {metaAdAccountId, metaGraphPost} from './graph-client';
import type {UnifiedPublishPlan} from './planner';
import {appendPublishLog} from './publish-log';

const GRAPH = 'https://graph.facebook.com/v21.0';

function pageId(): string {
  const id = process.env.META_PAGE_ID;
  if (!id) {
    throw new Error('META_PAGE_ID is not set');
  }
  return id;
}

function pixelId(): string {
  const id = process.env.META_PIXEL_ID;
  if (!id) {
    throw new Error('META_PIXEL_ID is not set (required for traffic ad sets)');
  }
  return id;
}

/**
 * Uploads a video to the ad account and returns video id.
 */
export async function metaUploadVideo(localPath: string): Promise<string> {
  const buf = readFileSync(localPath);
  const form = new FormData();
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is not set');
  }
  form.append('access_token', token);
  form.append('source', new Blob([buf]), 'video.mp4');

  const url = `${GRAPH}/${metaAdAccountId()}/advideos`;
  const res = await fetch(url, {method: 'POST', body: form});
  const json = (await res.json()) as {id?: string; error?: {message: string}};
  if (!res.ok || !json.id) {
    throw new Error(
      `Meta video upload failed: ${json.error?.message ?? res.statusText}`,
    );
  }
  return json.id;
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
    platform: 'meta',
    httpStatus,
    requestPayload: {path, body: req},
    responsePayload: res,
  });
}

export async function metaPublishFromPlan(
  plan: UnifiedPublishPlan,
  opts: {dryRun: boolean},
): Promise<{
  dryRun: boolean;
  campaignRowId?: string;
  creativeId?: string;
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  adsManagerUrl: string;
  preview?: Record<string, unknown>;
}> {
  const adsManagerUrl = 'https://business.facebook.com/adsmanager/';

  if (opts.dryRun) {
    const envPixel = process.env.META_PIXEL_ID?.trim();
    const envPage = process.env.META_PAGE_ID?.trim();
    return {
      dryRun: true,
      adsManagerUrl,
      preview: {
        campaign: {
          name: plan.campaignName,
          objective: plan.meta.metaObjective,
          status: 'PAUSED',
        },
        adSet: {
          name: plan.meta.adSetName,
          daily_budget_usd: plan.dailyBudgetUsd,
          targeting: plan.meta.targeting,
          optimization_goal: 'LINK_CLICKS',
          promoted_object: envPixel ? {pixel_id: envPixel} : null,
          note: envPixel
            ? undefined
            : 'Live publish requires META_PIXEL_ID on traffic ad sets.',
        },
        creative: {
          page_id: envPage ?? null,
          video_message: plan.primaryText,
          link: plan.linkUrlMeta,
          note: envPage
            ? undefined
            : 'Live publish requires META_PAGE_ID for the creative.',
        },
      },
    };
  }

  const insert: Insertable<CampaignsTable> = {
    renderId: plan.renderId,
    platform: 'meta',
    mode: 'draft',
    status: 'publishing',
    budgetUsd: plan.dailyBudgetUsd,
    targeting: plan.meta.targeting as Record<string, unknown>,
    externalIds: {},
    name: plan.campaignName,
    objective: plan.meta.metaObjective,
    destinationUrl: plan.linkUrlMeta,
    utm: plan.utmByPlatform.meta as Record<string, unknown>,
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
    const videoId = await metaUploadVideo(plan.filePath);

    const campBody = {
      name: plan.campaignName,
      objective: plan.meta.metaObjective,
      status: 'PAUSED',
      special_ad_categories: [],
    };
    const campRes = await metaGraphPost(
      `/${metaAdAccountId()}/campaigns`,
      campBody,
    );
    await log(cid, 'campaigns', campBody, campRes.json, campRes.status);
    if (!campRes.ok) {
      throw new Error(
        `Meta campaign: ${(campRes.json as {error?: {message: string}}).error?.message ?? campRes.status}`,
      );
    }
    const fbCampaignId = String((campRes.json as {id?: string}).id ?? '');
    if (!fbCampaignId) {
      throw new Error('Meta campaign: missing id');
    }

    const pixel = pixelId();
    const dailyBudgetCents = Math.round(plan.dailyBudgetUsd * 100);
    const adSetBody: Record<string, unknown> = {
      name: plan.meta.adSetName,
      campaign_id: fbCampaignId,
      daily_budget: dailyBudgetCents,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: plan.meta.targeting,
      status: 'PAUSED',
      promoted_object: {
        pixel_id: pixel,
      },
    };

    const adSetRes = await metaGraphPost(
      `/${metaAdAccountId()}/adsets`,
      adSetBody,
    );
    await log(cid, 'adsets', adSetBody, adSetRes.json, adSetRes.status);
    if (!adSetRes.ok) {
      throw new Error(
        `Meta ad set: ${(adSetRes.json as {error?: {message: string}}).error?.message ?? adSetRes.status}`,
      );
    }
    const fbAdSetId = String((adSetRes.json as {id?: string}).id ?? '');
    if (!fbAdSetId) {
      throw new Error('Meta ad set: missing id');
    }

    const creativeBody = {
      name: `${plan.campaignName} — creative`,
      object_story_spec: {
        page_id: pageId(),
        video_data: {
          video_id: videoId,
          title: plan.headline ?? plan.campaignName,
          message: plan.primaryText,
          call_to_action: {
            type: 'LEARN_MORE',
            value: {
              link: plan.linkUrlMeta,
            },
          },
        },
      },
    };

    const creRes = await metaGraphPost(
      `/${metaAdAccountId()}/adcreatives`,
      creativeBody,
    );
    await log(cid, 'adcreatives', creativeBody, creRes.json, creRes.status);
    if (!creRes.ok) {
      throw new Error(
        `Meta creative: ${(creRes.json as {error?: {message: string}}).error?.message ?? creRes.status}`,
      );
    }
    const creativeId = String((creRes.json as {id?: string}).id ?? '');
    if (!creativeId) {
      throw new Error('Meta creative: missing id');
    }

    const adBody = {
      name: `${plan.campaignName} — ad`,
      adset_id: fbAdSetId,
      creative: {creative_id: creativeId},
      status: 'PAUSED',
    };

    const adRes = await metaGraphPost(`/${metaAdAccountId()}/ads`, adBody);
    await log(cid, 'ads', adBody, adRes.json, adRes.status);
    if (!adRes.ok) {
      throw new Error(
        `Meta ad: ${(adRes.json as {error?: {message: string}}).error?.message ?? adRes.status}`,
      );
    }
    const adId = String((adRes.json as {id?: string}).id ?? '');

    await db
      .updateTable('campaigns')
      .set({
        status: 'paused',
        pausedAt: new Date(),
        externalIds: {
          campaignId: fbCampaignId,
          adSetId: fbAdSetId,
          creativeId,
          adId,
          videoId,
        } as Record<string, unknown>,
      })
      .where('id', '=', cid)
      .execute();

    return {
      dryRun: false,
      campaignRowId: cid,
      campaignId: fbCampaignId,
      adSetId: fbAdSetId,
      creativeId,
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

/** @deprecated Use metaPublishFromPlan + UnifiedPublishPlan */
export async function metaPublishFromRender(
  input: DraftInput,
  mode: PublishMode,
): Promise<{creativeId?: string; adsManagerUrl: string}> {
  if (input.kind !== 'video') {
    throw new Error('Meta publisher only supports video');
  }
  if (mode === 'launch') {
    throw new Error(
      'Launch mode is disabled — campaigns are always created PAUSED.',
    );
  }
  const videoId = await metaUploadVideo(input.filePath);
  const creativeBody = {
    name: input.name,
    object_story_spec: {
      page_id: pageId(),
      video_data: {
        video_id: videoId,
        message: input.name,
      },
    },
  };
  const creRes = await metaGraphPost(
    `/${metaAdAccountId()}/adcreatives`,
    creativeBody,
  );
  await appendPublishLog({
    platform: 'meta',
    httpStatus: creRes.status,
    requestPayload: {path: 'adcreatives', name: input.name},
    responsePayload: creRes.json,
  });
  if (!creRes.ok) {
    throw new Error(
      `Meta adcreative failed: ${(creRes.json as {error?: {message: string}}).error?.message ?? creRes.status}`,
    );
  }
  const creativeId = String((creRes.json as {id?: string}).id ?? '');
  return {
    creativeId,
    adsManagerUrl: 'https://business.facebook.com/adsmanager/',
  };
}
