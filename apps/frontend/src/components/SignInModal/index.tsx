import {cn} from '~/lib/utils';
import {buttonVariants} from '../ui/button';

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

export const SignInModal = () => {
  return <div>SignInModal</div>;
};
