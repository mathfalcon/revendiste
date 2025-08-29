import {SignUp} from '@clerk/tanstack-react-start';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/registrarse/$')({
  component: Page,
});

function Page() {
  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignUp />
    </div>
  );
}
