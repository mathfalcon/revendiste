import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import {db} from '../db/index';
import {resolveRenderVideoPath} from '../lib/resolve-render-file';
import {audienceSuggest} from '../publishers/audiences';
import {
  buildUnifiedPlan,
  marketingObjectiveSchema,
  type MarketingObjective,
} from '../publishers/planner';
import type {DraftInput} from '../publishers/common';
import {metaPublishFromPlan, metaPublishFromRender} from '../publishers/meta';
import {tiktokPublishFromPlan} from '../publishers/tiktok';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type Parsed = {
  platform: 'meta' | 'tiktok';
  renderId?: string;
  file?: string;
  budget: number;
  objective: MarketingObjective;
  campaignName: string;
  campaignSlug: string;
  primaryText: string;
  headline?: string;
  destination?: string;
  dryRun: boolean;
  confirm: boolean;
  /** Legacy: creative-only Meta upload (no campaign stack). */
  legacyCreativeOnly: boolean;
};

function parseArgs(): Parsed {
  const a = process.argv.slice(2);
  let platform: 'meta' | 'tiktok' | '' = '';
  let renderId: string | undefined;
  let file: string | undefined;
  let budget = 5;
  let objective: MarketingObjective = 'traffic';
  let campaignName = process.env.MARKETING_CAMPAIGN_NAME ?? 'Revendiste';
  let campaignSlug =
    process.env.MARKETING_CAMPAIGN_SLUG ??
    `revendiste-${new Date().toISOString().slice(0, 10)}`;
  let primaryText =
    process.env.MARKETING_PRIMARY_TEXT ?? 'Revendiste — revendé tus entradas.';
  let headline: string | undefined;
  let destination: string | undefined;
  let dryRun = false;
  let confirm = false;
  let legacyCreativeOnly = false;

  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x === '--platform' && a[i + 1]) {
      platform = a[++i] as 'meta' | 'tiktok';
    } else if (x === '--render-id' && a[i + 1]) {
      renderId = a[++i];
    } else if (x === '--file' && a[i + 1]) {
      file = a[++i];
    } else if (x === '--budget' && a[i + 1]) {
      budget = Number(a[++i]);
    } else if (x === '--objective' && a[i + 1]) {
      objective = marketingObjectiveSchema.parse(a[++i]);
    } else if (x === '--campaign-name' && a[i + 1]) {
      campaignName = a[++i]!;
    } else if (x === '--campaign-slug' && a[i + 1]) {
      campaignSlug = a[++i]!;
    } else if (x === '--primary-text' && a[i + 1]) {
      primaryText = a[++i]!;
    } else if (x === '--headline' && a[i + 1]) {
      headline = a[++i];
    } else if (x === '--destination' && a[i + 1]) {
      destination = a[++i];
    } else if (x === '--dry-run') {
      dryRun = true;
    } else if (x === '--confirm') {
      confirm = true;
    } else if (x === '--legacy-creative-only') {
      legacyCreativeOnly = true;
    }
  }

  if (!platform || (platform !== 'meta' && platform !== 'tiktok')) {
    console.error('Missing or invalid --platform meta|tiktok');
    process.exit(1);
  }

  return {
    platform,
    renderId,
    file,
    budget,
    objective,
    campaignName,
    campaignSlug,
    primaryText,
    headline,
    destination,
    dryRun,
    confirm,
    legacyCreativeOnly,
  };
}

async function ensureRenderRowForFile(absFile: string): Promise<string> {
  const brief = await db
    .selectFrom('briefs')
    .select('id')
    .where('slug', '=', 'cli-publish')
    .executeTakeFirst();
  if (!brief) {
    throw new Error(
      'Brief cli-publish not found — run: pnpm db:seed (includes seeds/briefs/cli-publish.json)',
    );
  }
  const id = randomUUID();
  await db
    .insertInto('renders')
    .values({
      id,
      briefId: brief.id,
      variantLabel: 'cli-upload',
      engine: 'remotion',
      status: 'done',
      params: {localFilePath: absFile} as Record<string, unknown>,
      assetUrls: null,
      durationMs: null,
      errorMessage: null,
      createdAt: new Date(),
    })
    .execute();
  return id;
}

async function main() {
  const args = parseArgs();

  if (args.legacyCreativeOnly) {
    if (!args.file) {
      console.error('--legacy-creative-only requires --file');
      process.exit(1);
    }
    const abs = args.file.startsWith('/')
      ? args.file
      : resolve(marketingRoot, args.file);
    const input: DraftInput = {
      renderId: 'legacy-cli',
      filePath: abs,
      kind: 'video',
      name: args.campaignName,
    };
    const r = await metaPublishFromRender(input, 'draft');
    console.info(JSON.stringify(r, null, 2));
    return;
  }

  let renderId = args.renderId;
  let filePath: string | undefined = args.file
    ? args.file.startsWith('/')
      ? args.file
      : resolve(marketingRoot, args.file)
    : undefined;

  if (!renderId && filePath) {
    renderId = await ensureRenderRowForFile(filePath);
    console.info(`Created render row ${renderId} for ${filePath}`);
  }

  if (!renderId) {
    console.error(
      'Provide --render-id <uuid> and/or --file path/to.mp4 for the unified publisher.',
    );
    process.exit(1);
  }

  if (!filePath) {
    const resolved = await resolveRenderVideoPath(renderId);
    if (!resolved) {
      console.error(
        'Could not resolve video path — pass --file or ensure output/{renderId}.mp4 exists.',
      );
      process.exit(1);
    }
    filePath = resolved.path;
  }

  if (!args.dryRun && !args.confirm) {
    console.error(
      'Refusing live API calls without --confirm (creates PAUSED ads). Use --dry-run to preview.',
    );
    process.exit(1);
  }

  const audience = await audienceSuggest({
    campaignSlug: args.campaignSlug,
    briefTags: ['cli'],
    eventHints: [],
  });

  const plan = buildUnifiedPlan({
    renderId,
    filePath,
    campaignName: args.campaignName,
    campaignSlug: args.campaignSlug,
    objective: args.objective,
    dailyBudgetUsd: args.budget,
    primaryText: args.primaryText,
    headline: args.headline,
    destination: args.destination,
    audienceMeta: audience.meta,
    audienceTiktok: audience.tiktok,
  });

  console.info('Plan JSON:\n', JSON.stringify(plan, null, 2));

  if (args.platform === 'meta') {
    const r = await metaPublishFromPlan(plan, {dryRun: args.dryRun});
    console.info(JSON.stringify(r, null, 2));
  } else {
    const r = await tiktokPublishFromPlan(plan, {dryRun: args.dryRun});
    console.info(JSON.stringify(r, null, 2));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
