import {createFileRoute} from '@tanstack/react-router';
import {MarkdownPage} from '~/components';

export const Route = createFileRoute('/terminos-y-condiciones')({
  component: TermsPage,
  loader: async () => {
    // TODO: Replace with actual terms.md file when available
    const content = await import('~/assets/documents/tos.md?raw');
    return {markdown: content.default};
  },
  head: () => ({
    meta: [
      {
        title: 'Términos y Condiciones | Revendiste',
      },
    ],
  }),
});

function TermsPage() {
  const {markdown} = Route.useLoaderData();

  return <MarkdownPage content={markdown} />;
}
