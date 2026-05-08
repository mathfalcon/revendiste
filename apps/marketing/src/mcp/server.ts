import 'dotenv/config';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

import {db} from '../db/index';
import {lookupEventsByQuery} from '../lib/event-lookup';
import {getMarketingObjectSignedUrl} from '../lib/s3';
import {resolveRenderVideoPath} from '../lib/resolve-render-file';
import {
  audienceSuggest,
  listMetaAudiencesCached,
  listTiktokAudiencesCached,
} from '../publishers/audiences';
import {buildMarketingUrl, DEFAULT_HOME_DESTINATION} from '../publishers/utm';
import {
  buildUnifiedPlan,
  marketingObjectiveSchema,
  type UnifiedPublishPlan,
} from '../publishers/planner';
import {metaPublishFromPlan} from '../publishers/meta';
import {tiktokPublishFromPlan} from '../publishers/tiktok';

function jsonResult(data: unknown) {
  return {
    content: [{type: 'text' as const, text: JSON.stringify(data, null, 2)}],
  };
}

const server = new McpServer({
  name: 'revendiste-marketing',
  version: '0.2.0',
  title: 'Revendiste marketing studio',
});

server.registerTool(
  'render_list',
  {
    description:
      'List renders from the local marketing DB (Remotion / uploads).',
    inputSchema: z.object({
      status: z.string().optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
  },
  async args => {
    const limit = args.limit ?? 50;
    let q = db.selectFrom('renders').selectAll().orderBy('createdAt', 'desc');
    if (args.status) {
      q = q.where('status', '=', args.status as any);
    }
    const rows = await q.limit(limit).execute();
    return jsonResult(rows);
  },
);

server.registerTool(
  'render_preview',
  {
    description:
      'Presigned GET URL for an MP4 in MinIO/R2 when render status is done.',
    inputSchema: z.object({
      renderId: z.string().uuid(),
    }),
  },
  async args => {
    const row = await db
      .selectFrom('renders')
      .select(['id', 'status', 'assetUrls'])
      .where('id', '=', args.renderId)
      .executeTakeFirst();
    if (!row) {
      return jsonResult({error: 'Render not found'});
    }
    const assets = row.assetUrls as Record<string, unknown> | null;
    const mp4Key =
      assets && typeof assets.mp4Key === 'string' ? assets.mp4Key : null;
    if (row.status !== 'done' || !mp4Key) {
      return jsonResult({
        url: null,
        status: row.status,
        hint: 'Need status done + assetUrls.mp4Key from worker upload.',
      });
    }
    const url = await getMarketingObjectSignedUrl(mp4Key);
    return jsonResult({url, status: row.status, mp4Key});
  },
);

server.registerTool(
  'event_lookup',
  {
    description:
      'Search main-app events by slug/name (requires MAIN_DATABASE_URL).',
    inputSchema: z.object({
      query: z.string().min(1),
    }),
  },
  async args => {
    const rows = await lookupEventsByQuery(args.query);
    return jsonResult(rows);
  },
);

server.registerTool(
  'audience_list_meta',
  {
    description: 'List Meta custom/saved audiences (cached 1h).',
    inputSchema: z.object({
      forceRefresh: z.boolean().optional(),
    }),
  },
  async args => {
    const rows = await listMetaAudiencesCached(args.forceRefresh ?? false);
    return jsonResult(rows);
  },
);

server.registerTool(
  'audience_list_tiktok',
  {
    description: 'List TikTok custom audiences (cached 1h).',
    inputSchema: z.object({
      forceRefresh: z.boolean().optional(),
    }),
  },
  async args => {
    const rows = await listTiktokAudiencesCached(args.forceRefresh ?? false);
    return jsonResult(rows);
  },
);

server.registerTool(
  'audience_suggest',
  {
    description:
      'Rule-based UY targeting + fuzzy match against existing audiences (stack by default).',
    inputSchema: z.object({
      campaignSlug: z.string().min(1),
      briefTags: z.array(z.string()).optional(),
      eventHints: z.array(z.string()).optional(),
      drop: z.array(z.string()).optional(),
      forceRefresh: z.boolean().optional(),
    }),
  },
  async args => {
    const result = await audienceSuggest({
      campaignSlug: args.campaignSlug,
      briefTags: args.briefTags ?? null,
      eventHints: args.eventHints ?? null,
      drop: args.drop,
      forceRefresh: args.forceRefresh,
    });
    return jsonResult(result);
  },
);

server.registerTool(
  'utm_build',
  {
    description: 'Build homepage (or custom) URL with standard UTMs.',
    inputSchema: z.object({
      destination: z.string().optional(),
      campaignSlug: z.string().min(1),
      platform: z.enum(['meta', 'tiktok']),
      contentVariant: z.string().optional(),
      adSetLabel: z.string().optional(),
    }),
  },
  async args => {
    const dest = args.destination ?? DEFAULT_HOME_DESTINATION;
    const r = buildMarketingUrl({
      destination: dest,
      campaignSlug: args.campaignSlug,
      platform: args.platform,
      contentVariant: args.contentVariant,
      adSetLabel: args.adSetLabel,
    });
    return jsonResult(r);
  },
);

server.registerTool(
  'campaign_plan',
  {
    description:
      'Build a UnifiedPublishPlan (dry JSON). Does not call Meta/TikTok.',
    inputSchema: z.object({
      renderId: z.string().uuid(),
      filePath: z.string().optional(),
      campaignName: z.string().min(1),
      campaignSlug: z.string().min(1),
      objective: marketingObjectiveSchema,
      dailyBudgetUsd: z.number().positive(),
      primaryText: z.string().min(1),
      headline: z.string().optional(),
      destination: z.string().optional(),
      briefTags: z.array(z.string()).optional(),
      eventHints: z.array(z.string()).optional(),
      drop: z.array(z.string()).optional(),
    }),
  },
  async args => {
    let filePath = args.filePath ?? null;
    if (!filePath) {
      const resolved = await resolveRenderVideoPath(args.renderId);
      if (!resolved) {
        return jsonResult({
          error:
            'Could not resolve video file — pass filePath or ensure output/{renderId}.mp4 or params.localFilePath exists.',
        });
      }
      filePath = resolved.path;
    }
    const audience = await audienceSuggest({
      campaignSlug: args.campaignSlug,
      briefTags: args.briefTags ?? null,
      eventHints: args.eventHints ?? null,
      drop: args.drop,
    });
    const plan = buildUnifiedPlan({
      renderId: args.renderId,
      filePath,
      campaignName: args.campaignName,
      campaignSlug: args.campaignSlug,
      objective: args.objective,
      dailyBudgetUsd: args.dailyBudgetUsd,
      primaryText: args.primaryText,
      headline: args.headline,
      destination: args.destination,
      audienceMeta: audience.meta,
      audienceTiktok: audience.tiktok,
    });
    return jsonResult(plan as UnifiedPublishPlan);
  },
);

server.registerTool(
  'publish_meta',
  {
    description:
      'Create Meta campaign → ad set → creative → ad (always PAUSED). Use dryRun:true first.',
    inputSchema: z.object({
      plan: z.string().min(10),
      dryRun: z.boolean(),
    }),
  },
  async args => {
    const plan = JSON.parse(args.plan) as UnifiedPublishPlan;
    const result = await metaPublishFromPlan(plan, {dryRun: args.dryRun});
    return jsonResult(result);
  },
);

server.registerTool(
  'publish_tiktok',
  {
    description:
      'Create TikTok campaign → ad group → ad (DISABLE). Use dryRun:true first.',
    inputSchema: z.object({
      plan: z.string().min(10),
      dryRun: z.boolean(),
    }),
  },
  async args => {
    const plan = JSON.parse(args.plan) as UnifiedPublishPlan;
    const result = await tiktokPublishFromPlan(plan, {dryRun: args.dryRun});
    return jsonResult(result);
  },
);

server.registerTool(
  'campaign_list',
  {
    description: 'List persisted marketing campaigns (local Postgres).',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(200).optional(),
    }),
  },
  async args => {
    const limit = args.limit ?? 50;
    const rows = await db
      .selectFrom('campaigns')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .execute();
    return jsonResult(rows);
  },
);

server.registerTool(
  'publish_log_tail',
  {
    description: 'Recent publish_logs rows (API audit trail).',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(200).optional(),
    }),
  },
  async args => {
    const limit = args.limit ?? 50;
    const rows = await db
      .selectFrom('publishLogs')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .execute();
    return jsonResult(rows);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
