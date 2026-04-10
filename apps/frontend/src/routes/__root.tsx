/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router';
import * as React from 'react';
import type {QueryClient} from '@tanstack/react-query';
import {DefaultCatchBoundary} from '~/components/DefaultCatchBoundary';
import {NotFound} from '~/components/NotFound';
import {ClerkVariables, Navbar, Footer, FullScreenLoading} from '~/components';
import {ThemeProvider, useTheme} from '~/components/ThemeProvider';
import {ClerkProvider, Show} from '@clerk/tanstack-react-start';
import {esUY} from '@clerk/localizations';
import {Toaster} from '~/components/ui/sonner';
import {WhatsAppOptInModal} from '~/components/WhatsAppOptInModal';
import {PwaInstallBanner} from '~/components/PwaInstallBanner';
import {VITE_APP_ENV} from '~/config/env';
import {StickyBarProvider} from '~/contexts';
import {createServerFn} from '@tanstack/react-start';
import {auth} from '@clerk/tanstack-react-start/server';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {PostHogProvider} from 'posthog-js/react';
import {useUser} from '@clerk/tanstack-react-start';
import posthog from 'posthog-js';
import {getRootHead} from '~/utils/root-head';

export const fetchClerkAuth = createServerFn({method: 'GET'}).handler(
  async () => {
    const {userId} = await auth();
    return {userId};
  },
);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: getRootHead,
  pendingComponent: FullScreenLoading,
  errorComponent: props => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

const THEME_COLORS = {light: '#ffffff', dark: '#181819'} as const;

function ThemeColorSync() {
  const {resolvedTheme} = useTheme();

  React.useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', THEME_COLORS[resolvedTheme]);
    }
  }, [resolvedTheme]);

  return null;
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function PostHogIdentify() {
  const {user, isLoaded, isSignedIn} = useUser();

  React.useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

function RootDocument({children}: {children: React.ReactNode}) {
  const location = useLocation();

  React.useEffect(() => {
    // iOS PWA splash screens are injected client-side to keep SSR HTML lean for bots/crawlers
    const splashScreens = [
      [
        '/pwa/apple-splash-2048-2732.png',
        '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1668-2388.png',
        '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1536-2048.png',
        '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1640-2360.png',
        '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1668-2224.png',
        '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1620-2160.png',
        '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1488-2266.png',
        '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1320-2868.png',
        '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1206-2622.png',
        '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1260-2736.png',
        '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1290-2796.png',
        '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1179-2556.png',
        '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1170-2532.png',
        '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1284-2778.png',
        '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1125-2436.png',
        '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1242-2688.png',
        '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-828-1792.png',
        '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-1242-2208.png',
        '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-750-1334.png',
        '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-640-1136.png',
        '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      // Dark mode
      [
        '/pwa/apple-splash-dark-2048-2732.png',
        '(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1668-2388.png',
        '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1536-2048.png',
        '(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1640-2360.png',
        '(prefers-color-scheme: dark) and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1668-2224.png',
        '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1620-2160.png',
        '(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1488-2266.png',
        '(prefers-color-scheme: dark) and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1320-2868.png',
        '(prefers-color-scheme: dark) and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1206-2622.png',
        '(prefers-color-scheme: dark) and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1260-2736.png',
        '(prefers-color-scheme: dark) and (device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1290-2796.png',
        '(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1179-2556.png',
        '(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1170-2532.png',
        '(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1284-2778.png',
        '(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1125-2436.png',
        '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1242-2688.png',
        '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-828-1792.png',
        '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-1242-2208.png',
        '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-750-1334.png',
        '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
      [
        '/pwa/apple-splash-dark-640-1136.png',
        '(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      ],
    ] as const;

    const inserted: HTMLLinkElement[] = [];
    for (const [href, media] of splashScreens) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-startup-image';
      link.href = href;
      link.media = media;
      document.head.appendChild(link);
      inserted.push(link);
    }
    return () => {
      for (const link of inserted) link.remove();
    };
  }, []);

  // Define routes where navbar should be hidden
  const hideNavbarRoutes = ['/ingresar', '/registrarse'];
  const shouldHideNavbar = hideNavbarRoutes.some(route =>
    location.pathname.startsWith(route),
  );

  return (
    <html lang='es'>
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            ui_host: 'https://us.posthog.com',
            defaults: '2026-01-30',
            capture_exceptions: true,
            disable_surveys: true,
          }}
        >
          <ClerkProvider
            localization={esUY}
            appearance={{
              cssLayerName: 'clerk',
              elements: {
                formButtonPrimary: {
                  background: '#de2486',
                  boxShadow: 'none',
                },
                modalBackdrop: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                modalContent: {
                  backgroundColor: 'hsl(var(--background))',
                },
              },
              variables: ClerkVariables,
            }}
          >
            <PostHogIdentify />
            <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
              <ThemeColorSync />
              <StickyBarProvider>
                <div className='flex flex-col h-screen min-h-dvh bg-background'>
                  {!shouldHideNavbar && <Navbar />}
                  <main className='flex-1 bg-background-secondary'>
                    {children}
                  </main>
                  {!shouldHideNavbar && <Footer />}
                  {/* <TanStackRouterDevtools position='bottom-right' /> */}
                  <ReactQueryDevtools buttonPosition='bottom-left' />
                  <Scripts />
                  <Toaster position='top-center' />
                  <Show when='signed-in'>
                    {/* TODO: WhatsApp opt-in is hidden in production until the flow is ready — remove the env guard when shipping. */}
                    {VITE_APP_ENV !== 'production' && <WhatsAppOptInModal />}
                    <PwaInstallBanner />
                  </Show>
                </div>
              </StickyBarProvider>
            </ThemeProvider>
          </ClerkProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
