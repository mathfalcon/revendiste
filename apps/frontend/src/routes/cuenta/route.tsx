import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from '@tanstack/react-router';
import {Ticket, User, ScanQrCode, Upload, Menu} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {useQuery} from '@tanstack/react-query';
import {getMyListingsQuery} from '~/lib';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import {useState} from 'react';

const TAB_CONFIG = [
  {
    value: 'tickets',
    label: 'Mis tickets',
    icon: ScanQrCode,
    to: '/cuenta/tickets',
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
] as const;

export const Route = createFileRoute('/cuenta')({
  component: RouteComponent,
});

function RouteComponent() {
  const {pathname} = useLocation();
  const path = pathname.split('/').pop();
  const {data: listings} = useQuery(getMyListingsQuery());
  const [sheetOpen, setSheetOpen] = useState(false);

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
    <div className='container mx-auto max-w-4xl mt-4 md:mt-20 mb-6 md:mb-8 px-4 md:px-0'>
      <Tabs
        defaultValue={path}
        className='w-full flex flex-col md:flex-row gap-2'
      >
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
                  const isActive = tab.value === path;
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
