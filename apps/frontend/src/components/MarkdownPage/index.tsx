import {MarkdownContent} from '../MarkdownContent';

interface MarkdownPageProps {
  content: string;
}

export const MarkdownPage = ({content}: MarkdownPageProps) => {
  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        <article className='bg-card rounded-lg shadow-sm border border-border p-6 md:p-10 lg:p-12'>
          <MarkdownContent content={content} />
        </article>
      </div>
    </main>
  );
};

