import {SignIn} from '@clerk/tanstack-react-start';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/ingresar/$')({
  component: Page,
});

function Page() {
  return (
    <div className='flex justify-center items-center h-screen bg-background'>
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-red-500 hover:bg-slate-400 text-sm',
          },
        }}
      />
    </div>
  );
}
