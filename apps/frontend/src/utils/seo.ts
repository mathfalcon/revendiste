import {CDN_ASSETS} from '~/assets';

export const seo = ({
  title,
  description,
  keywords,
  image,
  noIndex = false,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  noIndex?: boolean;
}) => {
  const ogImage = image || CDN_ASSETS.DEFAULT_OG_IMAGE;

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
    {property: 'og:site_name', content: 'Revendiste'},
    {property: 'og:locale', content: 'es_UY'},
  ];

  return tags.filter(tag => tag.content !== undefined);
};
