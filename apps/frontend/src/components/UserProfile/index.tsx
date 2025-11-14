import {SignOutButton, useUser} from '@clerk/tanstack-react-start';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {Link} from '@tanstack/react-router';

export const UserProfile = () => {
  const {user} = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback>
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-background'>
        <DropdownMenuItem asChild>
          <Link to='/cuenta/publicaciones'>Publicaciones</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/cuenta/compras'>Mis compras</Link>
        </DropdownMenuItem>
        <SignOutButton>
          <DropdownMenuItem className='text-destructive'>
            Cerrar sesión
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
