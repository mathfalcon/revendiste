const GRAPH = 'https://graph.facebook.com/v21.0';

export function metaAccessToken(): string {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) {
    throw new Error('META_ACCESS_TOKEN is not set');
  }
  return t;
}

export function metaAdAccountId(): string {
  const raw = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!raw) {
    throw new Error('META_AD_ACCOUNT_ID is not set (use act_...)');
  }
  // Graph only exposes Marketing edges (e.g. customaudiences) on Ad Account nodes.
  // Bare numeric IDs hit the wrong object and return "(#100) nonexisting field (customaudiences)".
  if (raw.startsWith('act_')) {
    return raw;
  }
  if (/^\d+$/.test(raw)) {
    return `act_${raw}`;
  }
  return raw;
}

export async function metaGraphGet(path: string): Promise<unknown> {
  const url = new URL(`${GRAPH}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('access_token', metaAccessToken());
  const res = await fetch(url.toString());
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    throw new Error(
      `Meta Graph GET failed: ${res.status} ${JSON.stringify(json)}`,
    );
  }
  return json;
}

export async function metaGraphPost(
  path: string,
  body: Record<string, unknown>,
): Promise<{ok: boolean; status: number; json: Record<string, unknown>}> {
  const url = `${GRAPH}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...body, access_token: metaAccessToken()}),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return {ok: res.ok, status: res.status, json};
}
