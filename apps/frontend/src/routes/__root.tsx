/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools';
import * as React from 'react';
import type {QueryClient} from '@tanstack/react-query';
import {DefaultCatchBoundary} from '~/components/DefaultCatchBoundary';
import {NotFound} from '~/components/NotFound';
import appCss from '~/styles/app.css?url';
import {seo} from '~/utils/seo';
import {Navbar} from '~/components';
import {ThemeProvider} from '~/components/ThemeProvider';
import {ClerkProvider} from '@clerk/tanstack-react-start';
import {esUY} from '@clerk/localizations';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Revendiste | Transferí tus entradas de forma fácil y segura',
        description: `Revendiste es una plataforma de venta de entradas de forma fácil y segura. `,
      }),
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
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
      },
    ],
  }),
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

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({children}: {children: React.ReactNode}) {
  const location = useLocation();

  // Define routes where navbar should be hidden
  const hideNavbarRoutes = ['/ingresar', '/registrarse'];
  const shouldHideNavbar = hideNavbarRoutes.some(route =>
    location.pathname.startsWith(route),
  );

  return (
    <ClerkProvider
      localization={esUY}
      appearance={{
        cssLayerName: 'clerk',
      }}
    >
      <html>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
            <div className='flex flex-col min-h-screen bg-background-secondary'>
              {!shouldHideNavbar && <Navbar />}
              {children}
              <TanStackRouterDevtools position='bottom-right' />
              <ReactQueryDevtools buttonPosition='bottom-left' />
              <Scripts />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
