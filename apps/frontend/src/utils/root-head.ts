import type {AnyRouteMatch} from '@tanstack/react-router';
import appCss from '~/styles/app.css?url';
import {seo} from '~/utils/seo';
import {getBaseUrl, VITE_GTM_ID} from '~/config/env';

type RootHead = {
  links?: AnyRouteMatch['links'];
  scripts?: AnyRouteMatch['headScripts'];
  meta?: AnyRouteMatch['meta'];
  styles?: AnyRouteMatch['styles'];
};

const POPPINS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

const GOOGLE_ADS_ID = 'AW-18109696447';

const googleAdsHeadScripts: NonNullable<RootHead['scripts']> = import.meta.env
  .PROD
  ? [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`,
        async: true,
      },
      {
        children: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
`,
      },
    ]
  : [];

export function getRootHead(): RootHead {
  return {
    meta: [
      {charSet: 'utf-8'},
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      ...seo({
        title:
          'Revendiste | Comprá y vendé entradas de forma segura en Uruguay',
        description:
          'Comprá y vendé entradas para conciertos, fiestas y eventos en Uruguay. Operación entre personas con garantía, custodia de fondos y vendedores verificados: reventa segura en Revendiste.',
        baseUrl: getBaseUrl(),
      }),
      {name: 'language', content: 'es-UY'},
      {name: 'geo.region', content: 'UY'},
      {name: 'geo.placename', content: 'Uruguay'},
      {property: 'og:url', content: getBaseUrl()},
      {property: 'fb:app_id', content: '1401527228305458'},
      // PWA — iOS
      {name: 'apple-mobile-web-app-capable', content: 'yes'},
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {name: 'apple-mobile-web-app-title', content: 'Revendiste'},
    ],
    links: [
      {rel: 'stylesheet', href: appCss},
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {rel: 'manifest', href: '/site.webmanifest', color: '#ffffff'},
      {rel: 'icon', href: '/favicon.ico'},
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous' as const,
      },
      {
        rel: 'preconnect',
        href: 'https://cdn.revendiste.com',
        crossOrigin: 'anonymous' as const,
      },
      {
        rel: 'preconnect',
        href: 'https://clerk.revendiste.com',
        crossOrigin: 'anonymous' as const,
      },
      {
        rel: 'preconnect',
        href: 'https://www.googletagmanager.com',
        crossOrigin: 'anonymous' as const,
      },
      {rel: 'preload', href: POPPINS_URL, as: 'style'},
      {rel: 'stylesheet', href: POPPINS_URL, media: 'print'},
    ],
    scripts: [
      {
        children: `
          (function() {
            var t = localStorage.getItem('vite-ui-theme');
            var dark = t === 'dark' || ((t === null || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            var meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = dark ? '#181819' : '#ffffff';
            document.head.appendChild(meta);
          })();
        `,
      },
      {
        children: `
          (function() {
            const fontStylesheet = document.querySelector('link[href*="fonts.googleapis.com/css2"][media="print"]');
            if (fontStylesheet) {
              if (fontStylesheet.sheet) {
                fontStylesheet.media = 'all';
              } else {
                fontStylesheet.onload = function() { this.media = 'all'; };
                fontStylesheet.onerror = function() { this.media = 'all'; };
              }
            }
          })();
        `,
      },
      ...googleAdsHeadScripts,
    ],
  };
}
