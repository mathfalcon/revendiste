import {useState} from 'react';
import {useUser, useClerk} from '@clerk/tanstack-react-start';
import {useQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {getCurrentUserQuery} from '~/lib';
import {Avatar, AvatarImage, AvatarFallback} from '~/components/ui/avatar';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import {Separator} from '~/components/ui/separator';
import {useIsMobile} from '~/hooks/useIsMobile';
import {
  Ticket,
  Wallet,
  QrCode,
  Settings,
  LogOut,
  TicketPlus,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import {useTheme} from '../ThemeProvider';

const THEME_OPTIONS = [
  {value: 'light' as const, icon: Sun, label: 'Claro'},
  {value: 'dark' as const, icon: Moon, label: 'Oscuro'},
  {value: 'system' as const, icon: Monitor, label: 'Automático'},
];

const getActiveThemeIcon = (theme: string | undefined) => {
  if (theme === 'dark') return Moon;
  if (theme === 'light') return Sun;
  return Monitor;
};

const MENU_ITEMS = [
  {to: '/entradas/publicar', icon: TicketPlus, label: 'Publicar entradas'},
  {to: '/cuenta/publicaciones', icon: Ticket, label: 'Publicaciones'},
  {to: '/cuenta/tickets', icon: QrCode, label: 'Mis tickets'},
  {to: '/cuenta/retiro', icon: Wallet, label: 'Retiros'},
] as const;

export const UserProfile = () => {
  const {user} = useUser();
  const {data: currentUser} = useQuery(getCurrentUserQuery());
  const {signOut} = useClerk();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const isMobile = useIsMobile();

  const {theme, setTheme} = useTheme();
  const ActiveThemeIcon = getActiveThemeIcon(theme);
  const avatarUrl = currentUser?.imageUrl || user?.imageUrl;
  const initials =
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  const avatarButton = (
    <button className='rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer'>
      <Avatar className='h-8 w-8'>
        <AvatarImage src={avatarUrl} alt={user?.fullName || ''} />
        <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
      </Avatar>
    </button>
  );

  const menuContent = (
    <>
      {MENU_ITEMS.map(item => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className='flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
        >
          <item.icon className='h-4 w-4 text-muted-foreground' />
          {item.label}
        </Link>
      ))}
    </>
  );

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{avatarButton}</PopoverTrigger>
        <PopoverContent className='w-80 p-0' align='end' sideOffset={8}>
          <div className='flex items-center gap-3 border-b px-4 py-3'>
            <Avatar className='h-9 w-9'>
              <AvatarImage src={avatarUrl} alt={user?.fullName || ''} />
              <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col min-w-0'>
              <p className='text-sm font-semibold truncate'>
                {user?.fullName}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className='divide-y'>
            <div>{menuContent}</div>

            <Link
              to='/cuenta/configuracion'
              onClick={() => setOpen(false)}
              className='flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
            >
              <Settings className='h-4 w-4 text-muted-foreground' />
              Configuración
            </Link>

            <div>
              <button
                onClick={() => setThemeOpen(prev => !prev)}
                className='flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
              >
                <ActiveThemeIcon className='h-4 w-4 text-muted-foreground' />
                Tema
                <ChevronRight className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${themeOpen ? 'rotate-90' : ''}`} />
              </button>
              {themeOpen && (
                <div className='flex flex-col gap-0.5 pl-7 pr-4 pb-2'>
                  {THEME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors cursor-pointer ${theme === opt.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'}`}
                    >
                      <opt.icon className='h-3.5 w-3.5' />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                signOut({redirectUrl: '/'});
              }}
              className='flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer'
            >
              <LogOut className='h-4 w-4' />
              Cerrar sesión
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{avatarButton}</SheetTrigger>
      <SheetContent side='right' className='w-[85vw] sm:max-w-sm'>
        <SheetHeader className='text-left'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src={avatarUrl} alt={user?.fullName || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <SheetTitle className='text-base'>{user?.fullName}</SheetTitle>
              <p className='text-sm text-muted-foreground'>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </SheetHeader>

        <nav className='mt-6 flex flex-col gap-1'>
          {MENU_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent'
            >
              <item.icon className='h-5 w-5' />
              {item.label}
            </Link>
          ))}

          <Separator className='my-2' />

          <Link
            to='/cuenta/configuracion'
            onClick={() => setOpen(false)}
            className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent'
          >
            <Settings className='h-5 w-5' />
            Configuración
          </Link>

          <Separator className='my-2' />

          <button
            onClick={() => setThemeOpen(prev => !prev)}
            className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
          >
            <ActiveThemeIcon className='h-5 w-5' />
            Tema
            <ChevronRight className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${themeOpen ? 'rotate-90' : ''}`} />
          </button>
          {themeOpen && (
            <div className='flex flex-col gap-0.5 pl-6 pr-3 pb-2'>
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${theme === opt.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'}`}
                >
                  <opt.icon className='h-4 w-4' />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <Separator className='my-2' />

          <button
            onClick={() => {
              setOpen(false);
              signOut({redirectUrl: '/'});
            }}
            className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer'
          >
            <LogOut className='h-5 w-5' />
            Cerrar sesión
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
