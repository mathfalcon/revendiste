export type UtmParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
};

export function buildMarketingUrl(input: {
  destination: string | URL;
  campaignSlug: string;
  platform: 'meta' | 'tiktok';
  contentVariant?: string;
  adSetLabel?: string;
}): {url: string; utm: UtmParams} {
  const base =
    typeof input.destination === 'string'
      ? new URL(input.destination)
      : input.destination;

  const utm: UtmParams = {
    utm_source: input.platform === 'meta' ? 'meta' : 'tiktok',
    utm_medium: 'paid_social',
    utm_campaign: sanitizeSlug(input.campaignSlug),
    utm_content: sanitizeSlug(input.contentVariant ?? 'video'),
    utm_term: sanitizeSlug(input.adSetLabel ?? 'default'),
  };

  base.searchParams.set('utm_source', utm.utm_source);
  base.searchParams.set('utm_medium', utm.utm_medium);
  base.searchParams.set('utm_campaign', utm.utm_campaign);
  base.searchParams.set('utm_content', utm.utm_content);
  base.searchParams.set('utm_term', utm.utm_term);

  return {url: base.toString(), utm};
}

function sanitizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 120);
}

export const DEFAULT_HOME_DESTINATION = 'https://revendiste.com/';
