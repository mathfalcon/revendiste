import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from '@tanstack/react-router';
import {Ticket, User, ScanQrCode, Upload} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {useQuery} from '@tanstack/react-query';
import {getMyListingsQuery} from '~/lib';
import {Badge} from '~/components/ui/badge';

const TAB_CONFIG = [
  {
    value: 'perfil',
    label: 'Perfil',
    icon: User,
    to: '/cuenta/perfil',
  },
  {
    value: 'publicaciones',
    label: 'Publicaciones',
    icon: Ticket,
    to: '/cuenta/publicaciones',
  },
  {
    value: 'subir-tickets',
    label: 'Subir tickets',
    icon: Upload,
    to: '/cuenta/subir-tickets',
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
    value: 'compras',
    label: 'Mis compras',
    icon: ScanQrCode,
    to: '/cuenta/compras',
  },
] as const;

export const Route = createFileRoute('/cuenta')({
  component: RouteComponent,
});

function RouteComponent() {
  const {pathname} = useLocation();
  const path = pathname.split('/').pop();
  const {data: listings} = useQuery(getMyListingsQuery());

  // Calculate count of tickets needing uploads
  // Backend already checks event end date via canUploadDocument
  const ticketsNeedingUploadCount =
    listings
      ?.flatMap(listing =>
        listing.tickets.filter(
          ticket =>
            ticket.soldAt && !ticket.hasDocument && ticket.canUploadDocument,
        ),
      )
      .filter(Boolean).length || 0;

  return (
    <div className='container mx-auto max-w-4xl mt-4 md:mt-20 px-4 md:px-0'>
      <Tabs
        defaultValue={path}
        className='w-full flex flex-col md:flex-row gap-2'
      >
        {/* Mobile: Horizontal scrollable tabs at top */}
        <TabsList className='flex h-auto flex-row justify-start bg-inherit overflow-x-auto mb-4 w-full md:hidden'>
          {TAB_CONFIG.map(tab => (
            <TabsTrigger
              key={tab.value}
              className='shrink-0 justify-start text-sm flex items-center gap-2 whitespace-nowrap'
              value={tab.value}
              asChild
            >
              <Link to={tab.to}>
                <tab.icon className='h-4 w-4' /> <span>{tab.label}</span>
                {'badge' in tab && tab.badge
                  ? tab.badge(ticketsNeedingUploadCount)
                  : null}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Desktop: Vertical sidebar on the left */}
        <TabsList className='hidden md:flex h-auto flex-col justify-start bg-inherit w-auto min-w-[200px]'>
          {TAB_CONFIG.map(tab => (
            <TabsTrigger
              key={tab.value}
              className='w-full justify-start text-[1rem] flex items-center gap-2'
              value={tab.value}
              asChild
            >
              <Link to={tab.to}>
                <tab.icon /> {tab.label}
                {'badge' in tab && tab.badge
                  ? tab.badge(ticketsNeedingUploadCount)
                  : null}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content area - full width on mobile, flex-1 on desktop */}
        <div className='flex-1 w-full'>
          {TAB_CONFIG.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className='mt-0'>
              <Outlet />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
