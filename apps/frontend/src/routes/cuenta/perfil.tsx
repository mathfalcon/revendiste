import {createFileRoute} from '@tanstack/react-router';
import {PerfilView} from '~/features';

export const Route = createFileRoute('/cuenta/perfil')({
  component: PerfilView,
});
