import {Button} from '~/components/ui/button';
import {FullLogo} from '~/assets';
import {ModeToggle} from '../ModeToggle';
import {EventSearchInput} from '../SearchInput';
import {Link} from '@tanstack/react-router';
import {SignedIn, SignedOut, SignInButton} from '@clerk/tanstack-react-start';
import {cn} from '~/lib/utils';
import {UserProfile} from '../UserProfile';
import {SignInAppearance} from '../SignInModal';

export const Navbar = () => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 md:px-6 **:no-underline',
      )}
    >
      <div className='container mx-auto flex h-16 max-w-(--breakpoint-2xl) items-center justify-between gap-4'>
        {/* Left side */}
        <Link className='flex items-center gap-2 shrink-0 w-[150px]' to='/'>
          <FullLogo className='w-full' />
        </Link>

        {/* Center side */}

        <div className='items-center gap-2 hidden md:flex w-full max-w-[400px]'>
          <EventSearchInput />
        </div>

        {/* Right side */}
        <div className='flex items-center gap-3'>
          <ModeToggle />
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
            className='text-sm font-medium px-4 h-9 rounded-md shadow-sm'
            onClick={e => {
              e.preventDefault();
            }}
          >
            <Link to='/entradas/publicar'>Vende tus entradas</Link>
          </Button>

          <SignedIn>
            <UserProfile />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};
