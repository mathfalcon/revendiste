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
                <div className='flex flex-col h-screen bg-background-secondary'>
                  {!shouldHideNavbar && <Navbar />}
                  <main className='flex-1'>{children}</main>
                  {!shouldHideNavbar && <Footer />}
                  {/* <TanStackRouterDevtools position='bottom-right' /> */}
                  <ReactQueryDevtools buttonPosition='bottom-left' />
                  <Scripts />
                  <Toaster position='top-center' />
                  <Show when='signed-in'>
                    <WhatsAppOptInModal />
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
