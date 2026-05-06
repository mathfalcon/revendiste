import {SignIn, useAuth, useClerk} from '@clerk/tanstack-react-start';
import {createFileRoute, useSearch} from '@tanstack/react-router';
import {useQueryClient} from '@tanstack/react-query';
import {useEffect, useRef} from 'react';
import z from 'zod';
import {FullScreenLoading, SignInAppearance} from '~/components';
import {seo} from '~/utils/seo';

const searchSchema = z
  .object({
    redirectUrl: z.string().optional(),
  })
  .passthrough();

export const Route = createFileRoute('/ingresar/$')({
  component: Page,
  validateSearch: search => searchSchema.parse(search),
  head: () => ({
    meta: [
      ...seo({
        title: 'Ingresar | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});

function Page() {
  const search = useSearch({from: '/ingresar/$'});
  const {isSignedIn, isLoaded} = useAuth();
  const {signOut} = useClerk();
  const queryClient = useQueryClient();
  const signingOut = useRef(false);

  const rawParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const hasTicket = rawParams?.has('__clerk_ticket') ?? false;

  // single_session_mode: Clerk's <SignIn/> ignores __clerk_ticket when a
  // session already exists. Sign out first, keeping the ticket URL intact.
  useEffect(() => {
    if (!isLoaded || !hasTicket || !isSignedIn || signingOut.current) return;
    signingOut.current = true;
    queryClient.removeQueries({queryKey: ['users', 'me']});
    void signOut({redirectUrl: window.location.href});
  }, [isLoaded, hasTicket, isSignedIn, signOut, queryClient]);

  if (!isLoaded || (hasTicket && isSignedIn)) {
    return <FullScreenLoading />;
  }

  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignIn
        appearance={SignInAppearance}
        forceRedirectUrl={search.redirectUrl ?? '/'}
      />
    </div>
  );
}
