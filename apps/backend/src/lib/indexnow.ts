import {logger} from '~/utils';
import {wideEvent, withDuration} from '~/utils/logFields';

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = 100;

function getConfig(): {key: string; host: string; keyLocation: string} | null {
  const key = process.env.INDEXNOW_KEY;
  const host = process.env.INDEXNOW_HOST ?? 'revendiste.com';

  if (!key || process.env.NODE_ENV === 'local') return null;

  return {
    key,
    host,
    keyLocation: `https://${host}/${key}.txt`,
  };
}

/**
 * Pings IndexNow with the given URLs so Bing/Yandex/DDG index them immediately.
 * Fire-and-forget — never throws. Skipped in local dev or when INDEXNOW_KEY is unset.
 */
export function pingIndexNow(urls: string[]): void {
  const config = getConfig();
  if (!config || urls.length === 0) return;

  const {key, host, keyLocation} = config;

  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const startMs = Date.now();

    fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: JSON.stringify({host, key, keyLocation, urlList: batch}),
    })
      .then(res => {
        logger.info(
          'indexnow.pinged',
          wideEvent('indexnow.pinged', {
            ...withDuration(startMs),
            urlCount: batch.length,
            httpStatus: res.status,
            outcome: res.ok ? 'success' : 'failure',
          }),
        );
      })
      .catch(err => {
        logger.warn(
          'indexnow.pinged',
          wideEvent('indexnow.pinged', {
            ...withDuration(startMs),
            urlCount: batch.length,
            outcome: 'failure',
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      });
  }
}
