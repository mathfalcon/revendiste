import {useState} from 'react';
import {useUser, useClerk} from '@clerk/tanstack-react-start';
import {useQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {getCurrentUserQuery} from '~/lib';
import {SOCIAL_LINKS} from '@revendiste/shared';
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
  Flag,
  LayoutDashboard,
  CircleHelp,
  Mail,
  Instagram,
  MessageCircle,
  Twitter,
  Video,
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
  {to: '/cuenta/entradas', icon: QrCode, label: 'Mis entradas'},
  {to: '/cuenta/retiro', icon: Wallet, label: 'Retiros'},
] as const;

const MENU_ITEMS_USER = [
  {to: '/cuenta/configuracion', icon: Settings, label: 'Configuración'},
  {to: '/cuenta/reportes', icon: Flag, label: 'Reportes'},
] as const;

const ADMIN_MENU_ITEM = {
  to: '/admin/dashboard' as const,
  icon: LayoutDashboard,
  label: 'Administración',
};

const HELP_INFO_INTERNAL = [
  {to: '/contacto' as const, icon: Mail, label: 'Contacto'},
  {to: '/preguntas-frecuentes' as const, icon: CircleHelp, label: 'Preguntas frecuentes'},
] as const;

const HELP_INFO_SOCIAL = [
  {href: SOCIAL_LINKS.instagram, icon: Instagram, label: 'Instagram'},
  {href: SOCIAL_LINKS.tiktok, icon: Video, label: 'TikTok'},
  {href: SOCIAL_LINKS.twitter, icon: Twitter, label: 'Twitter / X'},
  {href: SOCIAL_LINKS.whatsapp, icon: MessageCircle, label: 'WhatsApp'},
] as const;

export const UserProfile = () => {
  const {user} = useUser();
  const {data: currentUser} = useQuery(getCurrentUserQuery());
  const {signOut} = useClerk();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [helpInfoOpen, setHelpInfoOpen] = useState(false);
  const isMobile = useIsMobile();

  const {theme, setTheme} = useTheme();
  const ActiveThemeIcon = getActiveThemeIcon(theme);
  const avatarUrl = currentUser?.imageUrl || user?.imageUrl;
  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

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
      <Popover
        open={open}
        onOpenChange={next => {
          setOpen(next);
          if (!next) {
            setThemeOpen(false);
            setHelpInfoOpen(false);
          }
        }}
      >
        <PopoverTrigger asChild>{avatarButton}</PopoverTrigger>
        <PopoverContent className='w-80 p-0' align='end' sideOffset={8}>
          <div className='flex items-center gap-3 border-b px-4 py-3'>
            <Avatar className='h-9 w-9'>
              <AvatarImage src={avatarUrl} alt={user?.fullName || ''} />
              <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col min-w-0'>
              <p className='text-sm font-semibold truncate'>{user?.fullName}</p>
              <p className='text-xs text-muted-foreground truncate'>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className='divide-y'>
            <div>{menuContent}</div>

            <div>
              {currentUser?.role === 'admin' && (
                <Link
                  to={ADMIN_MENU_ITEM.to}
                  onClick={() => setOpen(false)}
                  className='flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
                >
                  <ADMIN_MENU_ITEM.icon className='h-4 w-4 text-muted-foreground' />
                  {ADMIN_MENU_ITEM.label}
                </Link>
              )}
              {MENU_ITEMS_USER.map(item => (
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
            </div>

            <div>
              <button
                type='button'
                onClick={() => {
                  setHelpInfoOpen(prev => !prev);
                  setThemeOpen(false);
                }}
                className='flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
              >
                <CircleHelp className='h-4 w-4 text-muted-foreground' />
                Ayuda
                <ChevronRight
                  className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${helpInfoOpen ? 'rotate-90' : ''}`}
                />
              </button>
              {helpInfoOpen && (
                <div className='flex flex-col gap-0.5 pl-7 pr-4 pb-2'>
                  {HELP_INFO_INTERNAL.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      resetScroll
                      onClick={() => setOpen(false)}
                      className='flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer'
                    >
                      <item.icon className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                      {item.label}
                    </Link>
                  ))}
                  {HELP_INFO_SOCIAL.map(item => (
                    <a
                      key={item.href}
                      href={item.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={() => setOpen(false)}
                      className='flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer'
                    >
                      <item.icon className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type='button'
                onClick={() => {
                  setThemeOpen(prev => !prev);
                  setHelpInfoOpen(false);
                }}
                className='flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
              >
                <ActiveThemeIcon className='h-4 w-4 text-muted-foreground' />
                Tema
                <ChevronRight
                  className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${themeOpen ? 'rotate-90' : ''}`}
                />
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
              type='button'
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
    <Sheet
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) {
          setThemeOpen(false);
          setHelpInfoOpen(false);
        }
      }}
    >
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

          {currentUser?.role === 'admin' && (
            <Link
              to={ADMIN_MENU_ITEM.to}
              onClick={() => setOpen(false)}
              className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent'
            >
              <ADMIN_MENU_ITEM.icon className='h-5 w-5' />
              {ADMIN_MENU_ITEM.label}
            </Link>
          )}
          {MENU_ITEMS_USER.map(item => (
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

          <button
            type='button'
            onClick={() => {
              setHelpInfoOpen(prev => !prev);
              setThemeOpen(false);
            }}
            className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
          >
            <CircleHelp className='h-5 w-5' />
            Ayuda
            <ChevronRight
              className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${helpInfoOpen ? 'rotate-90' : ''}`}
            />
          </button>
          {helpInfoOpen && (
            <div className='flex flex-col gap-0.5 pl-6 pr-3 pb-2'>
              {HELP_INFO_INTERNAL.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  resetScroll
                  onClick={() => setOpen(false)}
                  className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
                >
                  <item.icon className='h-4 w-4 text-muted-foreground' />
                  {item.label}
                </Link>
              ))}
              {HELP_INFO_SOCIAL.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() => setOpen(false)}
                  className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
                >
                  <item.icon className='h-4 w-4 text-muted-foreground' />
                  {item.label}
                </a>
              ))}
            </div>
          )}

          <button
            type='button'
            onClick={() => {
              setThemeOpen(prev => !prev);
              setHelpInfoOpen(false);
            }}
            className='flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
          >
            <ActiveThemeIcon className='h-5 w-5' />
            Tema
            <ChevronRight
              className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${themeOpen ? 'rotate-90' : ''}`}
            />
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
            type='button'
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
