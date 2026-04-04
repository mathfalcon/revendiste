import type {AnyRouteMatch} from '@tanstack/react-router';
import appCss from '~/styles/app.css?url';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

type RootHead = {
  links?: AnyRouteMatch['links'];
  scripts?: AnyRouteMatch['headScripts'];
  meta?: AnyRouteMatch['meta'];
  styles?: AnyRouteMatch['styles'];
};

const POPPINS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

const splashScreen = (
  href: string,
  media: string,
): {rel: string; href: string; media: string} => ({
  rel: 'apple-touch-startup-image',
  href,
  media,
});

const iosSplashScreens = [
  // Light mode
  splashScreen(
    '/pwa/apple-splash-2048-2732.png',
    '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1668-2388.png',
    '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1536-2048.png',
    '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1640-2360.png',
    '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1668-2224.png',
    '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1620-2160.png',
    '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1488-2266.png',
    '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1320-2868.png',
    '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1206-2622.png',
    '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1260-2736.png',
    '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1290-2796.png',
    '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1179-2556.png',
    '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1170-2532.png',
    '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1284-2778.png',
    '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1125-2436.png',
    '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1242-2688.png',
    '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-828-1792.png',
    '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-1242-2208.png',
    '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-750-1334.png',
    '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-640-1136.png',
    '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  // Dark mode
  splashScreen(
    '/pwa/apple-splash-dark-2048-2732.png',
    '(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1668-2388.png',
    '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1536-2048.png',
    '(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1640-2360.png',
    '(prefers-color-scheme: dark) and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1668-2224.png',
    '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1620-2160.png',
    '(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1488-2266.png',
    '(prefers-color-scheme: dark) and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1320-2868.png',
    '(prefers-color-scheme: dark) and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1206-2622.png',
    '(prefers-color-scheme: dark) and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1260-2736.png',
    '(prefers-color-scheme: dark) and (device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1290-2796.png',
    '(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1179-2556.png',
    '(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1170-2532.png',
    '(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1284-2778.png',
    '(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1125-2436.png',
    '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1242-2688.png',
    '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-828-1792.png',
    '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-1242-2208.png',
    '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-750-1334.png',
    '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
  splashScreen(
    '/pwa/apple-splash-dark-640-1136.png',
    '(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  ),
];

export function getRootHead(): RootHead {
  return {
    meta: [
      {charSet: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      ...seo({
        title:
          'Revendiste | Comprá y vendé entradas de forma segura en Uruguay',
        description:
          'Revendiste es la plataforma más segura de Uruguay para comprar y vender entradas a conciertos, fiestas y eventos. Custodia de fondos, vendedores verificados y garantía de compra.',
        baseUrl: getBaseUrl(),
      }),
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
      {rel: 'manifest', href: '/site.webmanifest', color: '#fffff'},
      {rel: 'icon', href: '/favicon.ico'},
      ...iosSplashScreens,
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
        crossOrigin: 'anonymous' as const,
      },
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
        href: 'https://e-proxy.revendiste.com',
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
    ],
  };
}
