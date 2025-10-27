import {useQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';

export const Route = createFileRoute('/cuenta/publicaciones')({
  component: PublicacionesComponent,
});

function PublicacionesComponent() {
  const {data} = useQuery(getMyListingsQuery());
  console.log(data);
  return (
    <div className='rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
      <h3 className='mb-2 font-semibold text-lg'>Security Settings</h3>
      <p className='text-muted-foreground text-sm'>
        Manage your password, two-factor authentication, and active sessions to
        keep your account secure.
      </p>
    </div>
  );
}
