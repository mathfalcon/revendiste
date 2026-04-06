import {createFileRoute} from '@tanstack/react-router';
import {MarkdownPage} from '~/components';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

export const Route = createFileRoute('/terminos-y-condiciones')({
  component: TermsPage,
  loader: async () => {
    // TODO: Replace with actual terms.md file when available
    const content = await import('~/assets/documents/tos.md?raw');
    return {markdown: content.default};
  },
  head: () => {
    const baseUrl = getBaseUrl();
    return {
      meta: seo({
        title: 'Términos y Condiciones | Revendiste',
        description:
          'Leé los términos y condiciones de Revendiste. Reglas claras para la compra y venta segura de entradas a eventos en Uruguay.',
        baseUrl,
      }),
      links: [
        alternateHreflangEsUy(`${baseUrl}/terminos-y-condiciones`),
        {rel: 'canonical', href: `${baseUrl}/terminos-y-condiciones`},
      ],
    };
  },
});

function TermsPage() {
  const {markdown} = Route.useLoaderData();

  return <MarkdownPage content={markdown} />;
}
