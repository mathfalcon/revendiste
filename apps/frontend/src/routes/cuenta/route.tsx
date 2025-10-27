import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from '@tanstack/react-router';
import {Ticket, User} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';

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
] as const;

export const Route = createFileRoute('/cuenta')({
  component: RouteComponent,
});

function RouteComponent() {
  const {pathname} = useLocation();
  const path = pathname.split('/').pop();

  return (
    <Tabs
      className='flex w-full flex-row gap-2 container mx-auto my-auto max-h-[60vh] h-full max-w-3xl'
      defaultValue={path}
    >
      <TabsList className='flex h-auto flex-col justify-start bg-inherit'>
        {TAB_CONFIG.map(tab => (
          <TabsTrigger
            key={tab.value}
            className='w-full justify-start text-[1rem] flex items-center gap-2'
            value={tab.value}
            asChild
          >
            <Link to={tab.to}>
              <tab.icon /> {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className='flex-1'>
        {TAB_CONFIG.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className='mt-0'>
            <Outlet />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
