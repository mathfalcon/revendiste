import {Button} from '~/components/ui/button';
import {FullLogo} from '~/assets';
import {EventSearchInput} from '../SearchInput';
import {Link} from '@tanstack/react-router';
import {SignedIn, SignedOut, SignInButton} from '@clerk/tanstack-react-start';
import {cn} from '~/lib/utils';
import {UserProfile} from '../UserProfile';
import {SignInAppearance} from '../SignInModal';
import {NotificationBell} from '../NotificationBell';
import {Search} from 'lucide-react';
import {useState, useEffect, useRef} from 'react';
import {EventSearchModal} from '../EventSearchModal';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show navbar at the top of the page
      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Determine scroll direction
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      // Only update if scroll difference is significant enough
      if (scrollDifference >= scrollThreshold) {
        if (currentScrollY > lastScrollY.current) {
          // Scrolling down - hide navbar
          setIsVisible(false);
        } else {
          // Scrolling up - show navbar
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, {passive: true});

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 md:px-6 **:no-underline transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-y-0' : '-translate-y-full',
        )}
      >
        <div className='mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-4'>
          <Link
            className='flex items-center gap-2 shrink-0 w-[120px] md:w-[150px]'
            to='/'
          >
            <FullLogo className='w-full' />
          </Link>

          <div
            className='items-center gap-2 hidden md:flex w-full max-w-[400px] cursor-pointer'
            onClick={() => setIsSearchOpen(true)}
          >
            <EventSearchInput className='pointer-events-none' />
          </div>

          <div className='flex items-center gap-2 md:gap-3'>
            <Button
              variant='ghost'
              size='sm'
              className='md:hidden p-2 h-9 w-9'
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className='h-5 w-5' />
              <span className='sr-only'>Buscar eventos</span>
            </Button>

            <SignedOut>
              <SignInButton mode='modal' appearance={SignInAppearance}>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-sm font-medium hover:bg-accent hover:text-accent-foreground'
                >
                  Ingresar
                </Button>
              </SignInButton>
            </SignedOut>

            <Button
              size='sm'
              className='hidden md:flex text-sm font-medium px-4 h-9 rounded-md shadow-sm'
              onClick={e => {
                e.preventDefault();
              }}
            >
              <Link to='/entradas/publicar'>Vende tus entradas</Link>
            </Button>
            <SignedIn>
              <NotificationBell />
            </SignedIn>
            <SignedIn>
              <div className='w-[36px] h-[36px] flex items-center justify-center'>
                <UserProfile />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <EventSearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};
