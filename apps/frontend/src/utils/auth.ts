import {redirect} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';
import {getAuth} from '@clerk/tanstack-react-start/server';
import {getWebRequest} from '@tanstack/react-start/server';

export const redirectToSignInIfNotAuthenticated = createServerFn({
  method: 'GET',
}).handler(async () => {
  // Use `getAuth()` to access `isAuthenticated` and the user's ID
  const {isAuthenticated} = await getAuth(getWebRequest());

  // Protect the server function by checking if the user is signed in
  if (!isAuthenticated) {
    throw redirect({
      to: '/ingresar/$',
    });
  }

  return;
});
