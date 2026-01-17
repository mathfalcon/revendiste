import {createFileRoute} from '@tanstack/react-router';
import {VerificationPage} from '~/features/identity-verification';
import {seo} from '~/utils/seo';

export const Route = createFileRoute('/cuenta/verificar')({
  component: VerificationPage,
  head: () => ({
    meta: [
      ...seo({
        title: 'Verificar Identidad | Revendiste',
        description:
          'Verifica tu identidad para poder publicar entradas en Revendiste.',
        noIndex: true,
      }),
    ],
  }),
});
