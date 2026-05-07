import 'dotenv/config';
import express from 'express';
import {createServer as createHttpServer} from 'node:http';
import {WebSocketServer} from 'ws';
import {randomUUID} from 'node:crypto';
import {createServer as createViteServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {db} from '../db/index';
import {getMarketingObjectSignedUrl} from '../lib/s3';
import {getRenderQueue, startRenderWorker} from '../jobs/render-queue';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.MARKETING_WEB_PORT ?? 4001);

async function buildServer() {
  const app = express();
  app.use(express.json({limit: '2mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({ok: true, service: '@revendiste/marketing'});
  });

  app.get('/api/briefs', async (_req, res) => {
    try {
      const rows = await db
        .selectFrom('briefs')
        .selectAll()
        .orderBy('updatedAt', 'desc')
        .execute();
      res.json(rows);
    } catch (e) {
      res.status(500).json({error: String(e)});
    }
  });

  app.get('/api/renders', async (_req, res) => {
    try {
      const rows = await db
        .selectFrom('renders')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(100)
        .execute();
      res.json(rows);
    } catch (e) {
      res.status(500).json({error: String(e)});
    }
  });

  /** Presigned GET for finished Remotion MP4 (MinIO / R2). */
  app.get('/api/renders/:id/preview', async (req, res) => {
    try {
      const id = String(req.params.id ?? '');
      if (!id) {
        res.status(400).json({error: 'id required'});
        return;
      }
      const row = await db
        .selectFrom('renders')
        .select(['id', 'status', 'assetUrls'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) {
        res.status(404).json({error: 'Render not found'});
        return;
      }
      const assets = row.assetUrls as Record<string, unknown> | null;
      const mp4Key =
        assets && typeof assets.mp4Key === 'string' ? assets.mp4Key : null;
      if (row.status !== 'done' || !mp4Key) {
        res.json({
          url: null as string | null,
          status: row.status,
          mp4Key: mp4Key ?? undefined,
        });
        return;
      }
      const url = await getMarketingObjectSignedUrl(mp4Key);
      res.json({url, status: row.status, mp4Key});
    } catch (e) {
      res.status(500).json({error: String(e)});
    }
  });

  app.get('/api/campaigns', async (_req, res) => {
    try {
      const rows = await db
        .selectFrom('campaigns')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(100)
        .execute();
      res.json(rows);
    } catch (e) {
      res.status(500).json({error: String(e)});
    }
  });

  app.post('/api/renders', async (req, res) => {
    try {
      const briefSlug = String(req.body?.briefSlug ?? '');
      if (!briefSlug) {
        res.status(400).json({error: 'briefSlug required'});
        return;
      }
      const brief = await db
        .selectFrom('briefs')
        .select('id')
        .where('slug', '=', briefSlug)
        .executeTakeFirst();
      if (!brief) {
        res.status(404).json({error: 'Brief not found'});
        return;
      }
      const renderId = randomUUID();
      const variantLabel =
        req.body?.variantLabel != null
          ? String(req.body.variantLabel)
          : 'web-ui';
      await db
        .insertInto('renders')
        .values({
          id: renderId,
          briefId: brief.id,
          variantLabel,
          engine: 'remotion',
          status: 'queued',
          params: (req.body?.params ?? {}) as any,
          assetUrls: null,
          durationMs: null,
          errorMessage: null,
          createdAt: new Date(),
        })
        .execute();

      const queue = getRenderQueue();
      await queue.add(
        'spritz',
        {renderId},
        {removeOnComplete: true, attempts: 1},
      );

      res.json({renderId, status: 'queued'});
    } catch (e) {
      res.status(500).json({error: String(e)});
    }
  });

  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({server: httpServer, path: '/ws/logs'});
  wss.on('connection', ws => {
    ws.send(JSON.stringify({type: 'hello', message: 'marketing log stream'}));
  });

  const vite = await createViteServer({
    // Load apps/marketing/vite.config.ts (aliases, plugins). Without this, Vite
    // only sees root=src/web/ui and never picks up the workspace vite.config.
    configFile: join(marketingRoot, 'vite.config.ts'),
    server: {middlewareMode: true},
    appType: 'spa',
  });

  app.use(vite.middlewares);

  startRenderWorker();

  httpServer.listen(port, () => {
    console.info(`Marketing UI http://127.0.0.1:${port}`);
  });
}

buildServer().catch(e => {
  console.error(e);
  process.exit(1);
});
