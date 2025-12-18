import {SignIn} from '@clerk/tanstack-react-start';
import {createFileRoute, useSearch} from '@tanstack/react-router';
import z from 'zod';
import {SignInAppearance} from '~/components';

const productSearchSchema = z.object({
  redirectUrl: z.string().optional(),
});

export const Route = createFileRoute('/ingresar/$')({
  component: Page,
  validateSearch: search => productSearchSchema.parse(search),
  head: () => ({
    meta: [
      {
        title: 'Ingresar | Revendiste',
      },
    ],
  }),
});

function Page() {
  const {redirectUrl} = useSearch({from: '/ingresar/$'});
  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignIn appearance={SignInAppearance} forceRedirectUrl={redirectUrl} />
    </div>
  );
}
