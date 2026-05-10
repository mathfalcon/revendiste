import {Queue, Worker} from 'bullmq';
import IORedis from 'ioredis';
import {executeSpritzRender} from '../render/remotion-exec';

const redisUrl = process.env.MARKETING_REDIS_URL ?? 'redis://127.0.0.1:6479';

/** BullMQ recommends separate connections for Queue vs Worker. */
let queueConnection: IORedis | null = null;
let workerConnection: IORedis | null = null;
let queue: Queue | null = null;
let worker: Worker | null = null;

function getQueueConnection(): IORedis {
  if (!queueConnection) {
    queueConnection = new IORedis(redisUrl, {maxRetriesPerRequest: null});
  }
  return queueConnection;
}

function getWorkerConnection(): IORedis {
  if (!workerConnection) {
    workerConnection = new IORedis(redisUrl, {maxRetriesPerRequest: null});
  }
  return workerConnection;
}

export function getRenderQueue(): Queue {
  if (!queue) {
    queue = new Queue('marketing-renders', {connection: getQueueConnection()});
  }
  return queue;
}

export function startRenderWorker(): Worker {
  if (worker) {
    return worker;
  }
  worker = new Worker(
    'marketing-renders',
    async job => {
      const renderId = job.data?.renderId as string;
      if (!renderId) {
        throw new Error('Missing renderId');
      }
      await executeSpritzRender(renderId);
    },
    {connection: getWorkerConnection()},
  );
  worker.on('failed', (job, err) => {
    console.error('Render job failed', job?.id, err);
  });
  return worker;
}
