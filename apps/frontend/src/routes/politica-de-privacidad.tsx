import {createFileRoute} from '@tanstack/react-router';
import {MarkdownPage} from '~/components';

export const Route = createFileRoute('/politica-de-privacidad')({
  component: PrivacyPage,
  loader: async () => {
    const content = await import('~/assets/documents/privacy.md?raw');
    return {markdown: content.default};
  },
  head: () => ({
    meta: [
      {
        title: 'Política de Privacidad | Revendiste',
      },
    ],
  }),
});

function PrivacyPage() {
  const {markdown} = Route.useLoaderData();

  return <MarkdownPage content={markdown} />;
}
