import 'dotenv/config';
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {db, destroyDb} from './index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, '../../seeds/briefs');

type BriefSeed = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  prompt: string;
  props: Record<string, unknown>;
  tags?: string[] | null;
  targetPlatforms?: string[] | null;
};

async function main() {
  const files = readdirSync(seedsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const raw = readFileSync(join(seedsDir, file), 'utf-8');
    const data = JSON.parse(raw) as BriefSeed;
    const now = new Date();
    await db
      .insertInto('briefs')
      .values({
        slug: data.slug,
        title: data.title,
        kind: data.kind as any,
        status: data.status as any,
        prompt: data.prompt,
        props: data.props as any,
        tags: data.tags ?? null,
        targetPlatforms: data.targetPlatforms ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict(oc =>
        oc.column('slug').doUpdateSet({
          title: data.title,
          kind: data.kind as any,
          status: data.status as any,
          prompt: data.prompt,
          props: data.props as any,
          tags: data.tags ?? null,
          targetPlatforms: data.targetPlatforms ?? null,
          updatedAt: now,
        }),
      )
      .execute();
    console.info(`Seeded brief: ${data.slug}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await destroyDb();
  });
