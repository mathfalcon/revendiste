import {
  ParsedLocation,
  redirect,
  NavigateOptions,
} from '@tanstack/react-router';
import {toast} from 'sonner';

/**
 * Server-side utility to redirect to sign-in if user is not authenticated.
 * Used in route loaders and beforeLoad functions.
 */
export const beforeLoadRedirectToSignInIfNotAuthenticated = (
  userId: string | null,
  location: ParsedLocation,
) => {
  if (!userId) {
    throw redirect({
      to: '/ingresar/$',
      search: {
        redirectUrl: location.href,
      },
      replace: true,
    });
  }
};

/**
 * Client-side utility function to redirect to login.
 * This is a utility function that can be used with useNavigate hook.
 *
 * @param navigate - The navigate function from useNavigate hook
 * @param options - Optional configuration
 * @param options.message - Custom toast message (default: 'Por favor inicia sesión para continuar')
 * @param options.redirectUrl - Custom redirect URL (default: current window location)
 */
export const redirectToLogin = (
  navigate: (options: NavigateOptions) => void,
  options?: {
    message?: string;
    redirectUrl?: string;
  },
) => {
  navigate({
    to: '/ingresar/$',
    search: {
      redirectUrl: options?.redirectUrl ?? window.location.href,
    },
  });

  toast.info(options?.message ?? 'Por favor inicia sesión para continuar', {
    duration: 3000,
  });
};
