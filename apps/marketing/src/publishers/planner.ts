import {z} from 'zod';
import {buildMarketingUrl, DEFAULT_HOME_DESTINATION} from './utm';
import type {AudienceSuggestSide} from './audiences';

export const marketingObjectiveSchema = z.enum([
  'traffic',
  'engagement',
  'leads',
]);
export type MarketingObjective = z.infer<typeof marketingObjectiveSchema>;

export function metaObjectiveFor(o: MarketingObjective): string {
  switch (o) {
    case 'traffic':
      return 'OUTCOME_TRAFFIC';
    case 'engagement':
      return 'OUTCOME_ENGAGEMENT';
    case 'leads':
      return 'OUTCOME_LEADS';
    default:
      return 'OUTCOME_TRAFFIC';
  }
}

export function tiktokObjectiveFor(o: MarketingObjective): string {
  switch (o) {
    case 'traffic':
      return 'TRAFFIC';
    case 'engagement':
      return 'VIDEO_VIEWS';
    case 'leads':
      return 'LEAD_GENERATION';
    default:
      return 'TRAFFIC';
  }
}

export type UnifiedPublishPlan = {
  renderId: string;
  filePath: string;
  campaignSlug: string;
  campaignName: string;
  primaryText: string;
  headline?: string;
  objective: MarketingObjective;
  dailyBudgetUsd: number;
  /** Canonical landing without UTMs (homepage). */
  destinationBase: string;
  linkUrlMeta: string;
  linkUrlTiktok: string;
  utmByPlatform: {meta: Record<string, string>; tiktok: Record<string, string>};
  meta: {
    adSetName: string;
    targeting: Record<string, unknown>;
    metaObjective: string;
  };
  tiktok: {
    adGroupName: string;
    targeting: Record<string, unknown>;
    tiktokObjective: string;
  };
};

export function buildUnifiedPlan(input: {
  renderId: string;
  filePath: string;
  campaignName: string;
  campaignSlug: string;
  objective: MarketingObjective;
  dailyBudgetUsd: number;
  primaryText: string;
  headline?: string;
  destination?: string;
  audienceMeta: AudienceSuggestSide;
  audienceTiktok: AudienceSuggestSide;
}): UnifiedPublishPlan {
  const dest = input.destination ?? DEFAULT_HOME_DESTINATION;
  const metaUrl = buildMarketingUrl({
    destination: dest,
    campaignSlug: input.campaignSlug,
    platform: 'meta',
    contentVariant: 'meta-video',
    adSetLabel: 'meta-uy',
  });
  const tiktokUrl = buildMarketingUrl({
    destination: dest,
    campaignSlug: input.campaignSlug,
    platform: 'tiktok',
    contentVariant: 'tiktok-video',
    adSetLabel: 'tiktok-uy',
  });

  return {
    renderId: input.renderId,
    filePath: input.filePath,
    campaignSlug: input.campaignSlug,
    campaignName: input.campaignName,
    primaryText: input.primaryText,
    headline: input.headline,
    objective: input.objective,
    dailyBudgetUsd: input.dailyBudgetUsd,
    destinationBase: dest,
    linkUrlMeta: metaUrl.url,
    linkUrlTiktok: tiktokUrl.url,
    utmByPlatform: {
      meta: metaUrl.utm as unknown as Record<string, string>,
      tiktok: tiktokUrl.utm as unknown as Record<string, string>,
    },
    meta: {
      adSetName: `${input.campaignSlug}-meta-uy`,
      targeting: input.audienceMeta.baseTargeting,
      metaObjective: metaObjectiveFor(input.objective),
    },
    tiktok: {
      adGroupName: `${input.campaignSlug}-tiktok-uy`,
      targeting: input.audienceTiktok.baseTargeting,
      tiktokObjective: tiktokObjectiveFor(input.objective),
    },
  };
}
