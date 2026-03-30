import logger from "./logger";

interface MemoryStats {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
  arrayBuffersMB: number;
}

/**
 * Get current memory usage in MB
 */
export function getMemoryStats(): MemoryStats {
  const usage = process.memoryUsage();
  return {
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    rssMB: Math.round(usage.rss / 1024 / 1024),
    externalMB: Math.round(usage.external / 1024 / 1024),
    arrayBuffersMB: Math.round(usage.arrayBuffers / 1024 / 1024),
  };
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(label?: string): void {
  const stats = getMemoryStats();
  logger.debug(`Memory usage${label ? ` [${label}]` : ''}`, {
    heapUsed: `${stats.heapUsedMB}MB`,
    heapTotal: `${stats.heapTotalMB}MB`,
    rss: `${stats.rssMB}MB`,
    external: `${stats.externalMB}MB`,
    arrayBuffers: `${stats.arrayBuffersMB}MB`,
  });
}

/**
 * Start periodic memory monitoring
 * @param intervalMs - How often to log (default: 10 seconds)
 * @returns Function to stop monitoring
 */
export function startMemoryMonitor(intervalMs: number = 10000): () => void {
  let count = 0;
  const startStats = getMemoryStats();

  logger.info('Memory monitor started', {
    intervalSecs: intervalMs / 1000,
    initialHeap: `${startStats.heapUsedMB}MB`,
    initialRss: `${startStats.rssMB}MB`,
  });

  const interval = setInterval(() => {
    count++;
    const stats = getMemoryStats();
    const heapDelta = stats.heapUsedMB - startStats.heapUsedMB;
    const rssDelta = stats.rssMB - startStats.rssMB;

    logger.debug(`Memory snapshot #${count}`, {
      heapUsed: `${stats.heapUsedMB}MB`,
      heapTotal: `${stats.heapTotalMB}MB`,
      rss: `${stats.rssMB}MB`,
      heapDelta: `${heapDelta >= 0 ? '+' : ''}${heapDelta}MB`,
      rssDelta: `${rssDelta >= 0 ? '+' : ''}${rssDelta}MB`,
    });
  }, intervalMs);

  return () => {
    clearInterval(interval);
    const finalStats = getMemoryStats();
    logger.info('Memory monitor stopped', {
      totalSnapshots: count,
      finalHeap: `${finalStats.heapUsedMB}MB`,
      finalRss: `${finalStats.rssMB}MB`,
      heapGrowth: `${finalStats.heapUsedMB - startStats.heapUsedMB}MB`,
      rssGrowth: `${finalStats.rssMB - startStats.rssMB}MB`,
    });
  };
}
