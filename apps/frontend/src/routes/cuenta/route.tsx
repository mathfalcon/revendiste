import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from '@tanstack/react-router';
import {
  Ticket,
  Upload,
  Menu,
  Wallet,
  ShieldCheck,
  QrCode,
  Flag,
  Settings,
} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {getMyListingsQuery} from '~/lib';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Sheet, SheetContent, SheetTrigger} from '~/components/ui/sheet';
import {useState} from 'react';
import {seo} from '~/utils/seo';
import {beforeLoadRequireAuth} from '~/utils';
import {cn} from '~/lib/utils';

const TAB_CONFIG = [
  {
    value: 'entradas',
    label: 'Mis entradas',
    icon: QrCode,
    to: '/cuenta/entradas',
  },
  {
    value: 'publicaciones',
    label: 'Publicaciones',
    icon: Ticket,
    to: '/cuenta/publicaciones',
  },
  {
    value: 'subir-entradas',
    label: 'Subir entradas',
    icon: Upload,
    to: '/cuenta/subir-entradas',
    badge: (count: number) =>
      count > 0 ? (
        <Badge
          variant='destructive'
          className='ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-xs'
        >
          {count}
        </Badge>
      ) : null,
  },
  {
    value: 'retiro',
    label: 'Retiros',
    icon: Wallet,
    to: '/cuenta/retiro',
  },
  {
    value: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    to: '/cuenta/configuracion',
  },
  {
    value: 'reportes',
    label: 'Reportes',
    icon: Flag,
    to: '/cuenta/reportes',
  },
] as const;

export const Route = createFileRoute('/cuenta')({
  component: RouteComponent,
  head: () => ({
    meta: [
      ...seo({
        title: 'Mi Cuenta | Revendiste',
        noIndex: true,
      }),
    ],
  }),
  beforeLoad: async ({location}) => {
    return await beforeLoadRequireAuth(location);
  },
});

function RouteComponent() {
  const {pathname} = useLocation();
  const {data: listings} = useQuery(getMyListingsQuery());
  const [sheetOpen, setSheetOpen] = useState(false);

  // Match the active tab by pathname prefix (handles sub-routes like /cuenta/reportes/$reportId)
  const activeTab = TAB_CONFIG.find(
    tab => pathname === tab.to || pathname.startsWith(tab.to + '/'),
  );
  const activeTabValue = activeTab?.value;
  const isTabRoute = !!activeTabValue;

  // Prevent layout flash when navigating away from /cuenta entirely
  const isWithinCuentaRoute = pathname.startsWith('/cuenta');
  if (!isWithinCuentaRoute) {
    return null;
  }

  // Calculate count of tickets needing uploads
  const ticketsNeedingUploadCount =
    listings
      ?.flatMap(listing =>
        listing.tickets.filter(
          ticket => !ticket.hasDocument && ticket.canUploadDocument,
        ),
      )
      .filter(Boolean).length || 0;

  // Routes outside any tab (e.g. /cuenta/verificar) — render with container but no sidebar
  if (!isTabRoute) {
    return (
      <div className='container mx-auto max-w-4xl mt-4 md:mt-20 mb-6 md:mb-8 px-4 md:px-0'>
        <Outlet />
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-6xl mt-4 md:mt-20 mb-6 md:mb-8 px-4 md:px-0'>
      <div className='w-full flex flex-col md:flex-row gap-2'>
        {/* Mobile hamburger */}
        <div className='md:hidden mb-4 flex items-center justify-end'>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[85vw] sm:max-w-sm'>
              <nav className='mt-6 flex flex-col gap-2'>
                {TAB_CONFIG.map(tab => {
                  const isActive = tab.value === activeTabValue;
                  return (
                    <Link
                      key={tab.value}
                      to={tab.to}
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <tab.icon className='h-5 w-5' />
                        <span>{tab.label}</span>
                      </div>
                      {'badge' in tab && tab.badge
                        ? tab.badge(ticketsNeedingUploadCount)
                        : null}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop sidebar — plain nav, single Outlet avoids multiple-outlet flash */}
        <nav className='hidden md:flex flex-col w-auto min-w-[200px] gap-0.5 p-1'>
          {TAB_CONFIG.map(tab => {
            const isActive = tab.value === activeTabValue;
            return (
              <Link
                key={tab.value}
                to={tab.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-[1rem] font-medium transition-all w-full',
                  isActive
                    ? 'bg-background text-foreground shadow'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                <tab.icon className='h-4 w-4 shrink-0' />
                <span>{tab.label}</span>
                {'badge' in tab && tab.badge
                  ? tab.badge(ticketsNeedingUploadCount)
                  : null}
              </Link>
            );
          })}
        </nav>

        {/* Content — single Outlet, always rendered */}
        <div className='flex-1 w-full min-w-0'>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
