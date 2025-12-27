import {createFileRoute, Outlet, redirect} from '@tanstack/react-router';
import {LayoutDashboard, Wallet, FileText} from 'lucide-react';
import {Link, useLocation} from '@tanstack/react-router';
import {cn} from '~/lib/utils';
import {getCurrentUserQuery} from '~/lib';

export const Route = createFileRoute('/admin')({
  component: AdminDashboardLayout,
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

function AdminDashboardLayout() {
  const location = useLocation();
  const navigation = [
    {name: 'Panel', href: '/admin', icon: LayoutDashboard},
    {name: 'Pagos', href: '/admin/payouts', icon: Wallet},
    // Future: Reports, Analytics, etc.
  ];

  return (
    <div className='flex h-screen bg-background'>
      {/* Sidebar */}
      <aside className='w-64 border-r bg-background-secondary'>
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center border-b px-6'>
            <h1 className='text-xl font-bold'>Administración</h1>
          </div>
          <nav className='flex-1 space-y-1 px-3 py-4'>
            {navigation.map(item => {
              const isActive =
                item.href === '/admin'
                  ? location.pathname === '/admin' ||
                    location.pathname === '/admin/'
                  : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
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
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
