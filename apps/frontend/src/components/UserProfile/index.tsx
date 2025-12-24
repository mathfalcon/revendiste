import {UserButton} from '@clerk/tanstack-react-start';
import {Ticket, ScanQrCode, Wallet} from 'lucide-react';
import {UserButtonAppearance} from '../SignInModal';

export const UserProfile = () => {
  return (
    <UserButton appearance={UserButtonAppearance}>
      <UserButton.MenuItems>
        <UserButton.Link
          label='Vende tus entradas'
          labelIcon={<Ticket className='h-4 w-4' />}
          href='/entradas/publicar'
        />
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
        <UserButton.Link
          label='Retiros'
          labelIcon={<Wallet className='h-4 w-4' />}
          href='/cuenta/retiro'
        />
        <UserButton.Action label='manageAccount' />
        <UserButton.Action label='signOut' />
      </UserButton.MenuItems>
    </UserButton>
  );
};
