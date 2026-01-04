import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({content}: MarkdownContentProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Style headings
        h1: ({node, ...props}) => (
          <h1
            className='text-2xl md:text-3xl font-bold text-foreground mb-4 mt-6 first:mt-0 border-b border-border pb-2'
            {...props}
          />
        ),
        h2: ({node, ...props}) => (
          <h2
            className='text-xl md:text-2xl font-semibold text-foreground mb-3 mt-8 first:mt-0 border-b border-border pb-2'
            {...props}
          />
        ),
        h3: ({node, ...props}) => (
          <h3
            className='text-lg md:text-xl font-semibold text-foreground mb-2 mt-6'
            {...props}
          />
        ),
        // Style paragraphs
        p: ({node, ...props}) => (
          <p
            className='text-sm md:text-base text-foreground/90 mb-3 leading-6'
            {...props}
          />
        ),
        // Style lists
        ul: ({node, ...props}) => (
          <ul
            className='list-disc list-outside ml-5 mb-3 space-y-1.5 text-foreground/90'
            {...props}
          />
        ),
        ol: ({node, ...props}) => (
          <ol
            className='list-decimal list-outside ml-5 mb-3 space-y-1.5 text-foreground/90'
            {...props}
          />
        ),
        li: ({node, ...props}) => (
          <li className='text-sm md:text-base leading-6' {...props} />
        ),
        // Style strong/bold text
        strong: ({node, ...props}) => (
          <strong className='font-semibold text-foreground' {...props} />
        ),
        // Style links
        a: ({node, ...props}) => (
          <a
            className='text-primary hover:text-primary-600 underline underline-offset-2 transition-colors'
            {...props}
          />
        ),
        // Style horizontal rules
        hr: ({node, ...props}) => (
          <hr className='my-6 border-t border-border' {...props} />
        ),
        // Style code blocks
        code: ({node, className, ...props}: any) => {
          const isInline = !className;
          return isInline ? (
            <code
              className='bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground'
              {...props}
            />
          ) : (
            <code
              className='block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground mb-4'
              {...props}
            />
          );
        },
        // Style blockquotes
        blockquote: ({node, ...props}) => (
          <blockquote
            className='border-l-4 border-primary pl-4 italic text-foreground/80 my-3 text-sm md:text-base'
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

