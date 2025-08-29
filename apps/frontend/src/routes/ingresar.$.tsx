import {SignIn} from '@clerk/tanstack-react-start';
import {createFileRoute} from '@tanstack/react-router';
import {SignInAppearance} from '~/components';

export const Route = createFileRoute('/ingresar/$')({
  component: Page,
});

function Page() {
  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignIn appearance={SignInAppearance} />
    </div>
  );
}
