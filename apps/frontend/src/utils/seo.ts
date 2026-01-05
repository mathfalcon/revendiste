import {CDN_ASSETS} from '~/assets';

// Detect image MIME type from URL
const getImageType = (url: string): string => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.webp')) return 'image/webp';
  if (lowerUrl.includes('.png')) return 'image/png';
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
  if (lowerUrl.includes('.gif')) return 'image/gif';
  // Default to JPEG for WhatsApp compatibility
  return 'image/jpeg';
};

export const seo = ({
  title,
  description,
  keywords,
  image,
  noIndex = false,
  baseUrl,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  noIndex?: boolean;
  baseUrl?: string;
}) => {
  const ogImage = image || CDN_ASSETS.DEFAULT_OG_IMAGE;
  const imageType = getImageType(ogImage);
  // Use a larger logo for og:logo (512x512 is a good size for logos)
  const ogLogo = baseUrl
    ? `${baseUrl}/android-chrome-512x512.png`
    : '/android-chrome-512x512.png';

  const tags = [
    {title},
    {name: 'description', content: description},
    {name: 'keywords', content: keywords},
    // Robots
    ...(noIndex ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
    // Twitter (uses name attribute)
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:creator', content: '@revendiste'},
    {name: 'twitter:site', content: '@revendiste'},
    {name: 'twitter:image', content: ogImage},
    {name: 'twitter:card', content: 'summary_large_image'},
    // Open Graph (uses property attribute)
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: ogImage},
    // WhatsApp requires these additional OG image tags
    // Note: WhatsApp supports WebP (as of 2022), but still prefers 1200x630px dimensions
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:image:type', content: imageType},
    {property: 'og:image:alt', content: title},
    {property: 'og:site_name', content: 'Revendiste'},
    {property: 'og:locale', content: 'es_UY'},
    // og:logo (not standard OG, but some validators require it)
    ...(baseUrl ? [{property: 'og:logo', content: ogLogo}] : []),
  ];

  return tags.filter(tag => tag.content !== undefined);
};
