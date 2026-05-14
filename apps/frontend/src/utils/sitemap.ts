export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
};

export type SitemapIndexEntry = {
  loc: string;
  lastmod?: string;
};

export const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';
export const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600';

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': XML_CONTENT_TYPE,
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
}

export function generateSitemapXML(urls: SitemapUrl[]): string {
  const entries = urls
    .map(url => {
      let entry = `  <url>
    <loc>${url.loc}</loc>`;

      if (url.lastmod) {
        entry += `
    <lastmod>${url.lastmod}</lastmod>`;
      }

      if (url.changefreq) {
        entry += `
    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        entry += `
    <priority>${url.priority}</priority>`;
      }

      entry += `
  </url>`;

      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export function generateSitemapIndexXML(entries: SitemapIndexEntry[]): string {
  const items = entries
    .map(entry => {
      let item = `  <sitemap>
    <loc>${entry.loc}</loc>`;
      if (entry.lastmod) {
        item += `
    <lastmod>${entry.lastmod}</lastmod>`;
      }
      item += `
  </sitemap>`;
      return item;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;
}
