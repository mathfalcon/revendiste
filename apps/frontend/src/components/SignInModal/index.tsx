import {cn} from '~/lib/utils';
import {buttonVariants} from '../ui/button';
import {TanstackStartClerkProviderProps} from 'node_modules/@clerk/tanstack-react-start/dist/client/types';

export const SignInAppearance = {
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
};

export const UserButtonAppearance = {
  elements: {
    userButtonPopoverMain: 'bg-background',
    userPreviewTextContainer: 'text-foreground',
    userPreviewSecondaryIdentifier: 'text-muted-foreground',
    button: 'text-foreground',
    button__signOut: '!text-destructive',
    userButtonPopoverFooter: {
      background: 'hsl(var(--background))',
    },
    scrollBox: 'bg-background',
    navbar: 'bg-background text-white',
  },
  variables: {
    colorPrimary: 'red', // Example: change primary color to red
    colorBackground: 'blue',
  },
};

export const ClerkVariables: NonNullable<
  TanstackStartClerkProviderProps['appearance']
>['variables'] = {
  // Primary colors - Jazzberry Jam theme
  colorPrimary: 'hsl(var(--primary))',
  colorPrimaryForeground: 'hsl(var(--primary-foreground))',

  // Text colors
  colorForeground: 'hsl(var(--foreground))',
  colorMutedForeground: 'hsl(var(--muted-foreground))',

  // Background colors
  colorBackground: 'hsl(var(--background))',
  colorMuted: 'hsl(var(--muted))',

  // Input colors
  colorInput: 'hsl(var(--input))',
  colorInputForeground: 'hsl(var(--foreground))',

  // Border and ring
  colorRing: 'hsl(var(--ring))',

  // Danger/destructive color
  colorDanger: 'hsl(var(--destructive))',

  // Neutral color (for borders, hover states, etc.)
  colorNeutral: 'hsl(var(--foreground))',

  // Typography
  fontFamily: 'Poppins, sans-serif',
  fontFamilyButtons: 'Poppins, sans-serif',

  // Spacing and sizing
  borderRadius: '0.375rem',
  spacing: '1rem',
};
