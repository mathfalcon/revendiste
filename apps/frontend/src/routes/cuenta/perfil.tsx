import {createFileRoute} from '@tanstack/react-router';
import {ProfileView} from '~/features';

export const Route = createFileRoute('/cuenta/perfil')({
  component: ProfileView,
});
