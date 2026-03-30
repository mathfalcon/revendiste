import {createFileRoute} from '@tanstack/react-router';
import {MarkdownPage} from '~/components';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

export const Route = createFileRoute('/politica-de-privacidad')({
  component: PrivacyPage,
  loader: async () => {
    const content = await import('~/assets/documents/privacy.md?raw');
    return {markdown: content.default};
  },
  head: () => {
    const baseUrl = getBaseUrl();
    return {
      meta: seo({
        title: 'Política de Privacidad | Revendiste',
        description:
          'Conocé cómo Revendiste protege tus datos personales. Cifrado AES-256, cumplimiento con la Ley Nº 18.331 de Uruguay y acceso restringido a información sensible.',
        baseUrl,
      }),
      links: [{rel: 'canonical', href: `${baseUrl}/politica-de-privacidad`}],
    };
  },
});

function PrivacyPage() {
  const {markdown} = Route.useLoaderData();

  return <MarkdownPage content={markdown} />;
}
