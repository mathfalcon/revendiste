import {SignUp} from '@clerk/tanstack-react-start';
import {createFileRoute} from '@tanstack/react-router';
import {seo} from '~/utils/seo';

export const Route = createFileRoute('/registrarse/$')({
  component: Page,
  head: () => ({
    meta: [
      ...seo({
        title: 'Registrarse | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});

function Page() {
  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignUp />
    </div>
  );
}
