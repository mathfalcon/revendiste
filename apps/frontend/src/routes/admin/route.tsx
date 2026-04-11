import {createFileRoute, Outlet, redirect} from '@tanstack/react-router';
import {
  LayoutDashboard,
  Wallet,
  UserCheck,
  Menu,
  Calendar,
  Flag,
  DollarSign,
} from 'lucide-react';
import {Link, useLocation} from '@tanstack/react-router';
import {useState, useEffect} from 'react';
import {cn} from '~/lib/utils';
import {getCurrentUserQuery} from '~/lib';
import {seo} from '~/utils/seo';
import {Button} from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

export const Route = createFileRoute('/admin')({
  component: AdminDashboardLayout,
  head: () => ({
    meta: [
      ...seo({
        title: 'Administración | Revendiste',
        noIndex: true,
      }),
    ],
  }),
  beforeLoad: async ({context}) => {
    try {
      const user = await context.queryClient.ensureQueryData(
        getCurrentUserQuery(),
      );
      if (!user || user.role !== 'admin') {
        throw redirect({
          to: '/',
          throw: true,
        });
      }
      return {user};
    } catch (error) {
      // If the query fails (e.g., user not authenticated), redirect
      throw redirect({
        to: '/',
        throw: true,
      });
    }
  },
});

const navigation = [
  {name: 'Panel', href: '/admin/dashboard', icon: LayoutDashboard},
  {name: 'Eventos', href: '/admin/eventos', icon: Calendar},
  {name: 'Verificaciones', href: '/admin/verificaciones', icon: UserCheck},
  {name: 'Retiros', href: '/admin/retiros', icon: Wallet},
  {name: 'Finanzas', href: '/admin/finanzas', icon: DollarSign},
  {name: 'Reportes', href: '/admin/reportes', icon: Flag},
];

function SidebarNav({onNavigate}: {onNavigate?: () => void}) {
  const location = useLocation();

  return (
    <nav className='flex-1 space-y-1 px-3 py-4'>
      {navigation.map(item => {
        const isActive =
          item.href === '/admin'
            ? location.pathname === '/admin' || location.pathname === '/admin/'
            : location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
            )}
          >
            <item.icon className='h-5 w-5' />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className='flex bg-background h-full'>
      {/* Mobile header with menu button */}
      <div className='fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setSidebarOpen(true)}
          aria-label='Abrir menú'
        >
          <Menu className='h-5 w-5' />
        </Button>
        <h1 className='ml-2 text-lg font-bold'>Administración</h1>
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-64 p-0'>
          <SheetHeader className='border-b px-6 py-4'>
            <SheetTitle>Administración</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className='hidden w-64 border-r bg-background-secondary md:block'>
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center border-b px-6'>
            <h1 className='text-xl font-bold'>Administración</h1>
          </div>
          <SidebarNav />
        </div>
      </aside>

      {/* Main content */}
      {/* 
        py-6 sets the default (base) vertical padding for all screen sizes.
        md:py-12 applies vertical padding of 12 when the screen is at least 'md' (768px).
        Tailwind CSS applies responsive classes in order, so md:py-12 WILL override py-6 when the media query is active.
        If you're seeing py-4 (not py-6) taking precedence, check for a more specific selector or another class further up the tree. 
        Correct base + responsive usage is shown below.
      */}
      <main className='flex-1 container mx-auto p-6'>
        <Outlet />
      </main>
    </div>
  );
}
