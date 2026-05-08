import {db} from '../db/index';
import {metaAccessToken, metaAdAccountId, metaGraphGet} from './graph-client';

export type AudienceRow = {
  id: string;
  name: string;
  subtype?: string;
  source: 'custom' | 'saved';
};

const CACHE_TTL_MS = 60 * 60 * 1000;

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(t => t.length >= 2);
}

export function collectKeywords(input: {
  campaignSlug: string;
  briefTags?: string[] | null;
  eventHints?: string[] | null;
}): string[] {
  const parts = [
    input.campaignSlug,
    ...(input.briefTags ?? []),
    ...(input.eventHints ?? []),
  ];
  const set = new Set<string>();
  for (const p of parts) {
    for (const t of tokenize(p)) {
      set.add(t);
    }
  }
  return [...set];
}

export function matchAudiencesByKeywords(
  audiences: AudienceRow[],
  keywords: string[],
): {audience: AudienceRow; matchedOn: string[]}[] {
  const out: {audience: AudienceRow; matchedOn: string[]}[] = [];
  const kw = keywords.map(k => k.toLowerCase());
  for (const a of audiences) {
    const nameLower = a.name.toLowerCase();
    const matchedOn: string[] = [];
    for (const k of kw) {
      if (nameLower.includes(k)) {
        matchedOn.push(k);
      }
    }
    if (matchedOn.length === 0) {
      for (const k of kw) {
        if (k.length >= 3 && nameLower.split(/\s+/).some(w => w.includes(k))) {
          matchedOn.push(k);
        }
      }
    }
    if (matchedOn.length > 0) {
      out.push({audience: a, matchedOn: [...new Set(matchedOn)]});
    }
  }
  return out;
}

export function composeMetaBaseTargeting(): Record<string, unknown> {
  return {
    geo_locations: {countries: ['UY']},
    age_min: 18,
    age_max: 45,
    publisher_platforms: ['facebook', 'instagram'],
  };
}

/** TikTok requires location_ids for delivery; set TIKTOK_LOCATION_UY_IDS or TIKTOK_LOCATION_UY_ID before publishing. */
export function composeTiktokBaseTargeting(): Record<string, unknown> {
  const raw =
    process.env.TIKTOK_LOCATION_UY_IDS ??
    process.env.TIKTOK_LOCATION_UY_ID ??
    '';
  const locationIds = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return {
    location_ids: locationIds,
    age_groups: ['AGE_18_24', 'AGE_25_34', 'AGE_35_44'],
    placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
    gender: 'GENDER_UNLIMITED',
  };
}

async function fetchAllMetaCustomAudiences(): Promise<AudienceRow[]> {
  const act = metaAdAccountId();
  const rows: AudienceRow[] = [];
  const token = encodeURIComponent(metaAccessToken());
  let nextUrl: string | null =
    `https://graph.facebook.com/v21.0/${act}/customaudiences?fields=id,name,subtype&limit=500&access_token=${token}`;
  for (let i = 0; i < 20 && nextUrl; i++) {
    const res = await fetch(nextUrl);
    const page = (await res.json()) as {
      data?: {id: string; name: string; subtype?: string}[];
      paging?: {next?: string};
      error?: {message: string; code?: number};
    };
    if (!res.ok) {
      const msg = page.error?.message ?? res.statusText;
      // Wrong ad account id shape / missing Marketing permissions — continue without custom audiences.
      if (
        page.error?.code === 100 &&
        /nonexisting field \(customaudiences\)/i.test(msg)
      ) {
        console.warn(
          '[marketing] Meta custom audiences unavailable (check META_AD_ACCOUNT_ID is act_<id> and token has ads_read). Continuing with base targeting only.',
        );
        return [];
      }
      throw new Error(`Meta customaudiences: ${msg}`);
    }
    for (const d of page.data ?? []) {
      rows.push({
        id: d.id,
        name: d.name,
        subtype: d.subtype,
        source: 'custom',
      });
    }
    nextUrl = page.paging?.next ?? null;
  }
  return rows;
}

async function fetchMetaSavedAudiences(): Promise<AudienceRow[]> {
  const act = metaAdAccountId();
  try {
    const page = (await metaGraphGet(
      `/${act}/saved_audiences?fields=id,name&limit=500`,
    )) as {data?: {id: string; name: string}[]};
    return (page.data ?? []).map(d => ({
      id: d.id,
      name: d.name,
      source: 'saved' as const,
    }));
  } catch {
    return [];
  }
}

export async function listMetaAudiencesRemote(): Promise<AudienceRow[]> {
  const [custom, saved] = await Promise.all([
    fetchAllMetaCustomAudiences(),
    fetchMetaSavedAudiences(),
  ]);
  const byId = new Map<string, AudienceRow>();
  for (const r of [...custom, ...saved]) {
    byId.set(r.id, r);
  }
  return [...byId.values()];
}

export async function listMetaAudiencesCached(
  forceRefresh: boolean,
): Promise<AudienceRow[]> {
  const act = metaAdAccountId();
  const platform = 'meta';
  if (!forceRefresh) {
    const row = await db
      .selectFrom('audiencesCache')
      .selectAll()
      .where('platform', '=', platform)
      .where('adAccountId', '=', act)
      .executeTakeFirst();
    if (row?.payload && row.fetchedAt.getTime() > Date.now() - CACHE_TTL_MS) {
      const p = row.payload as {audiences?: AudienceRow[]};
      if (Array.isArray(p.audiences)) {
        return p.audiences;
      }
    }
  }
  const audiences = await listMetaAudiencesRemote();
  const now = new Date();
  await db
    .insertInto('audiencesCache')
    .values({
      platform,
      adAccountId: act,
      payload: {audiences} as Record<string, unknown>,
      fetchedAt: now,
    })
    .onConflict(oc =>
      oc.columns(['platform', 'adAccountId']).doUpdateSet({
        payload: {audiences} as Record<string, unknown>,
        fetchedAt: now,
      }),
    )
    .execute();
  return audiences;
}

function tiktokAdvertiserId(): string {
  const id = process.env.TIKTOK_ADVERTISER_ID;
  if (!id) {
    throw new Error('TIKTOK_ADVERTISER_ID is not set');
  }
  return id;
}

export async function listTiktokAudiencesRemote(): Promise<AudienceRow[]> {
  const BASE = 'https://business-api.tiktok.com/open_api/v1.3';
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    throw new Error('TIKTOK_ACCESS_TOKEN is not set');
  }
  const rows: AudienceRow[] = [];
  let page = 1;
  for (let i = 0; i < 50; i++) {
    const url = new URL(`${BASE}/dmp/custom_audience/list/`);
    url.searchParams.set('advertiser_id', tiktokAdvertiserId());
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', '100');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {'Access-Token': token},
    });
    const text = await res.text();
    let json: {
      code?: number;
      message?: string;
      data?: {list?: {audience_id: string; name: string}[]};
    };
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      throw new Error(
        `TikTok custom_audience/list: HTTP ${res.status} ${res.statusText} — ${text.slice(0, 240)}`,
      );
    }
    if (!res.ok || json.code !== 0) {
      throw new Error(
        `TikTok custom_audience/list failed: ${json.message ?? res.statusText}`,
      );
    }
    const list = json.data?.list ?? [];
    for (const item of list) {
      rows.push({
        id: item.audience_id,
        name: item.name,
        source: 'custom',
      });
    }
    if (list.length < 100) {
      break;
    }
    page += 1;
  }
  return rows;
}

export async function listTiktokAudiencesCached(
  forceRefresh: boolean,
): Promise<AudienceRow[]> {
  const act = tiktokAdvertiserId();
  const platform = 'tiktok';
  if (!forceRefresh) {
    const row = await db
      .selectFrom('audiencesCache')
      .selectAll()
      .where('platform', '=', platform)
      .where('adAccountId', '=', act)
      .executeTakeFirst();
    if (row?.payload && row.fetchedAt.getTime() > Date.now() - CACHE_TTL_MS) {
      const p = row.payload as {audiences?: AudienceRow[]};
      if (Array.isArray(p.audiences)) {
        return p.audiences;
      }
    }
  }
  const audiences = await listTiktokAudiencesRemote();
  const now = new Date();
  await db
    .insertInto('audiencesCache')
    .values({
      platform,
      adAccountId: act,
      payload: {audiences} as Record<string, unknown>,
      fetchedAt: now,
    })
    .onConflict(oc =>
      oc.columns(['platform', 'adAccountId']).doUpdateSet({
        payload: {audiences} as Record<string, unknown>,
        fetchedAt: now,
      }),
    )
    .execute();
  return audiences;
}

export type AudienceSuggestSide = {
  baseTargeting: Record<string, unknown>;
  includedAudiences: {id: string; name: string; matchedOn: string[]}[];
  droppedAudiences: string[];
};

export async function audienceSuggest(input: {
  campaignSlug: string;
  briefTags?: string[] | null;
  eventHints?: string[] | null;
  drop?: string[];
  forceRefresh?: boolean;
}): Promise<{meta: AudienceSuggestSide; tiktok: AudienceSuggestSide}> {
  const keywords = collectKeywords({
    campaignSlug: input.campaignSlug,
    briefTags: input.briefTags,
    eventHints: input.eventHints,
  });
  const dropLower = new Set((input.drop ?? []).map(d => d.toLowerCase()));

  const [metaList, tiktokList] = await Promise.all([
    listMetaAudiencesCached(input.forceRefresh ?? false),
    listTiktokAudiencesCached(input.forceRefresh ?? false),
  ]);

  const metaMatched = matchAudiencesByKeywords(metaList, keywords).filter(
    m => !dropLower.has(m.audience.name.toLowerCase()),
  );
  const tiktokMatched = matchAudiencesByKeywords(tiktokList, keywords).filter(
    m => !dropLower.has(m.audience.name.toLowerCase()),
  );

  const droppedAudiences = [...dropLower];

  const metaBase = composeMetaBaseTargeting();
  if (metaMatched.length > 0) {
    Object.assign(metaBase, {
      custom_audiences: metaMatched.map(m => ({id: m.audience.id})),
    });
  }

  const tiktokBase = composeTiktokBaseTargeting();
  if (tiktokMatched.length > 0) {
    Object.assign(tiktokBase, {
      included_custom_audience_ids: tiktokMatched.map(m => m.audience.id),
    });
  }

  return {
    meta: {
      baseTargeting: metaBase,
      includedAudiences: metaMatched.map(m => ({
        id: m.audience.id,
        name: m.audience.name,
        matchedOn: m.matchedOn,
      })),
      droppedAudiences,
    },
    tiktok: {
      baseTargeting: tiktokBase,
      includedAudiences: tiktokMatched.map(m => ({
        id: m.audience.id,
        name: m.audience.name,
        matchedOn: m.matchedOn,
      })),
      droppedAudiences,
    },
  };
}
