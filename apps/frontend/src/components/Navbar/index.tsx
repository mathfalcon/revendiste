import {Button, buttonVariants} from '~/components/ui/button';
import {FullLogo} from '~/assets';
import {ModeToggle} from '../ModeToggle';
import {SearchInput} from '../SearchInput';
import {Link} from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
  useSignIn,
} from '@clerk/tanstack-react-start';
import {cn} from '~/lib/utils';
import {UserProfile} from '../UserProfile';

// Hamburger icon component
const HamburgerIcon = ({
  className,
  ...props
}: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M4 12L20 12'
      className='origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315'
    />
    <path
      d='M4 12H20'
      className='origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45'
    />
    <path
      d='M4 12H20'
      className='origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135'
    />
  </svg>
);

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
          <SearchInput />
        </div>

        {/* Right side */}
        <div className='flex items-center gap-3'>
          <ModeToggle />
          <SignedOut>
            <SignInButton
              mode='modal'
              appearance={{
                elements: {
                  formFieldInput:
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                  formButtonPrimary: buttonVariants({variant: 'default'}),
                  buttonArrowIcon: 'hidden',
                  card: 'bg-background',
                  footer: {
                    background: 'hsl(var(--background))',
                  },
                  footerActionText: 'text-foreground',
                  footerActionLink: 'text-foreground',
                  rootBox: 'text-foreground',
                  headerTitle: 'text-foreground',
                  headerSubtitle: 'text-foreground',
                  socialButtonsBlockButton: cn(
                    buttonVariants({
                      variant: 'ghost',
                      className: 'bg-background-secondary',
                    }),
                  ),
                  modalCloseButton: 'text-foreground',
                  dividerLine: 'bg-foreground opacity-25',
                  dividerText: 'text-foreground opacity-25',
                  socialButtonsBlockButtonText: 'text-foreground',
                  formFieldLabel: 'text-foreground',
                  modalContent: 'm-auto',
                },
              }}
            >
              <Button
                variant='ghost'
                size='sm'
                className='text-sm font-medium hover:bg-accent hover:text-accent-foreground'
                onClick={e => {
                  e.preventDefault();
                }}
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
            Vende tus entradas
          </Button>
          <SignedIn>
            <UserProfile />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export {HamburgerIcon};
