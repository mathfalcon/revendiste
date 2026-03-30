import {createFileRoute} from '@tanstack/react-router';
import {ConfiguracionPage} from '~/features/configuracion';

export const Route = createFileRoute('/cuenta/configuracion')({
  component: ConfiguracionPage,
  head: () => ({
    meta: [
      {
        title: 'Configuración | Revendiste',
      },
    ],
  }),
});
