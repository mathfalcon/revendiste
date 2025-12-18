# SEO Implementation Guide

This document outlines the comprehensive SEO implementation for Revendiste, covering all aspects needed for excellent search engine rankings and AI crawler compatibility.

## ✅ Implemented Features

### 1. Meta Tags & Open Graph
- **Dynamic title tags**: Event-specific titles with brand name
- **Meta descriptions**: Rich descriptions including date, venue, and event details
- **Open Graph tags**: Full OG implementation for social media sharing
- **Twitter Cards**: Optimized for Twitter sharing
- **Keywords**: Auto-generated from event data

### 2. Structured Data (JSON-LD)
- **Event Schema.org markup**: Full event structured data including:
  - Event name, description, dates
  - Location (venue name and address)
  - Images
  - Offers/availability
  - Organizer information

### 3. Canonical URLs
- **Canonical links**: Prevents duplicate content issues
- **Absolute URLs**: Properly formatted for all meta tags

### 4. Sitemap.xml
- **Runtime generation**: Uses TanStack Router server routes for dynamic sitemap generation
- **Dynamic routes**: Automatically includes all events fetched from API at runtime
- **Always up-to-date**: Sitemap reflects current events without rebuild
- **Lastmod dates**: Uses event update timestamps
- **Priority and changefreq**: Optimized for event pages
- **Caching**: 1-hour cache to reduce server load
- **Server route**: Available at `/sitemap.xml`

### 5. robots.txt
- **Crawler control**: Allows/disallows specific paths
- **AI crawler support**: Explicitly allows GPTBot, ChatGPT, Claude, Perplexity, etc.
- **Sitemap reference**: Points crawlers to sitemap.xml

## 📋 Additional Recommendations

### 1. Environment Variables
Add to your `.env` file:
```env
VITE_APP_BASE_URL=https://revendiste.com
```

### 2. Performance Optimization
- ✅ Already using code splitting (TanStack Router)
- ✅ SSR support (TanStack Start)
- Consider:
  - Image optimization (WebP, lazy loading)
  - Font optimization
  - Core Web Vitals monitoring

### 3. Additional Meta Tags to Consider

#### Language and Locale
```tsx
{
  name: 'language',
  content: 'es-UY',
}
```

#### Geo-targeting (if applicable)
```tsx
{
  name: 'geo.region',
  content: 'UY',
}
{
  name: 'geo.placename',
  content: 'Uruguay',
}
```

### 4. Additional Structured Data

#### Organization Schema (for homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Revendiste",
  "url": "https://revendiste.com",
  "logo": "https://revendiste.com/logo.png",
  "sameAs": [
    "https://twitter.com/revendiste",
    "https://facebook.com/revendiste"
  ]
}
```

#### BreadcrumbList (for navigation)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

### 5. Additional Files to Create

#### humans.txt (Optional)
Create `public/humans.txt`:
```
/* TEAM */
Developer: Your Name
Contact: email@example.com
Twitter: @revendiste

/* THANKS */
Name: TanStack
URL: https://tanstack.com

/* SITE */
Last update: 2024/01/01
Standards: HTML5, CSS3, JavaScript
Components: React, TanStack Router
```

### 6. Security Headers (for SEO + Security)
Consider adding security headers that also help with SEO:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 7. Analytics & Monitoring

#### Google Search Console
1. Verify ownership
2. Submit sitemap: `https://revendiste.com/sitemap.xml`
3. Monitor indexing status
4. Check Core Web Vitals

#### Google Analytics 4
- Track page views
- Monitor user behavior
- Measure conversion rates

#### Bing Webmaster Tools
- Submit sitemap
- Monitor indexing

### 8. Social Media Optimization

#### Facebook Sharing Debugger
- Test OG tags: https://developers.facebook.com/tools/debug/
- Clear cache after changes

#### Twitter Card Validator
- Test Twitter Cards: https://cards-dev.twitter.com/validator

#### LinkedIn Post Inspector
- Test LinkedIn sharing: https://www.linkedin.com/post-inspector/

### 9. Mobile Optimization
- ✅ Responsive design (already implemented)
- ✅ Mobile-first approach
- Consider:
  - AMP pages (if needed)
  - Mobile page speed optimization

### 10. International SEO (if expanding)
- hreflang tags for multi-language support
- Country-specific domains or subdirectories
- Localized content

## 🔍 Testing & Validation

### Tools to Use:
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **PageSpeed Insights**: https://pagespeed.web.dev/
4. **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
5. **Lighthouse**: Built into Chrome DevTools

### Checklist:
- [ ] All pages have unique titles
- [ ] All pages have meta descriptions
- [ ] All images have alt text
- [ ] Structured data validates
- [ ] Sitemap is accessible and valid
- [ ] robots.txt is accessible
- [ ] Canonical URLs are correct
- [ ] Open Graph tags work on social platforms
- [ ] Page loads quickly (< 3 seconds)
- [ ] Mobile-friendly
- [ ] HTTPS enabled
- [ ] No broken links

## 🚀 Next Steps

1. **Set environment variable** `VITE_APP_BASE_URL=https://revendiste.com` for canonical URLs
2. **Set up Google Search Console** and submit sitemap at `https://revendiste.com/sitemap`
3. **Monitor Core Web Vitals** and optimize as needed
4. **Add organization schema** to homepage
5. **Test all meta tags** using validation tools
6. **Set up analytics** to track SEO performance
7. **Create content strategy** for blog/articles (if applicable)
8. **Build backlinks** through partnerships and content

## 📝 Sitemap Generation

The sitemap is generated **at runtime** using TanStack Router server routes. This means:

- ✅ Always up-to-date with current events
- ✅ No build-time complexity
- ✅ Simple to maintain and extend
- ✅ Available at `/sitemap`

**How it works**: When a request comes to `/sitemap`, the server route:
1. Fetches all events from your API
2. Generates XML with proper structure
3. Returns it with caching headers (1 hour cache)

**No special setup required** - just make sure your API is accessible when the sitemap is requested.

## 📚 Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [TanStack Router Head Management](https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management)

