import {ParsedLocation, redirect} from '@tanstack/react-router';

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
