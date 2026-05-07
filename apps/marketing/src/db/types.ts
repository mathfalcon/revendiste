import type {Generated} from 'kysely';

export type BriefKind =
  | 'video_kinetic'
  | 'video_ai'
  | 'video_ugc'
  | 'carousel_howto';

export type BriefStatus = 'draft' | 'ready' | 'archived';

export type RenderEngine = 'remotion' | 'higgsfield' | 'satori';

export type RenderStatus = 'queued' | 'running' | 'done' | 'failed';

export type CampaignPlatform = 'meta' | 'tiktok';

export type CampaignMode = 'draft' | 'launched';

export interface BriefsTable {
  id: Generated<string>;
  slug: string;
  title: string;
  kind: BriefKind;
  status: BriefStatus;
  prompt: string;
  props: Record<string, unknown>;
  tags: string[] | null;
  targetPlatforms: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RendersTable {
  id: Generated<string>;
  briefId: string;
  variantLabel: string | null;
  engine: RenderEngine;
  status: RenderStatus;
  params: Record<string, unknown> | null;
  assetUrls: Record<string, unknown> | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface CampaignsTable {
  id: Generated<string>;
  renderId: string;
  platform: CampaignPlatform;
  mode: CampaignMode;
  externalIds: Record<string, unknown> | null;
  targeting: Record<string, unknown> | null;
  /** numeric from Postgres (node-pg often returns string) */
  budgetUsd: string | number | null;
  status: string;
  createdAt: Date;
}

export interface PublishLogsTable {
  id: Generated<string>;
  campaignId: string | null;
  platform: string;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  httpStatus: number | null;
  createdAt: Date;
}

export interface MarketingDatabase {
  briefs: BriefsTable;
  renders: RendersTable;
  campaigns: CampaignsTable;
  publishLogs: PublishLogsTable;
}
