import {UserButton} from '@clerk/tanstack-react-start';
import {Ticket, ScanQrCode} from 'lucide-react';
import {UserButtonAppearance} from '../SignInModal';

export const UserProfile = () => {
  return (
    <UserButton appearance={UserButtonAppearance}>
      <UserButton.MenuItems>
        <UserButton.Link
          label='Publicaciones'
          labelIcon={<Ticket className='h-4 w-4' />}
          href='/cuenta/publicaciones'
        />
        <UserButton.Link
          label='Mis tickets'
          labelIcon={<ScanQrCode className='h-4 w-4' />}
          href='/cuenta/tickets'
        />
        <UserButton.Action label='manageAccount' />
        <UserButton.Action label='signOut' />
      </UserButton.MenuItems>
    </UserButton>
  );
};
