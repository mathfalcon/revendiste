export function generateSitemapXML(
  urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }>,
): string {
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
