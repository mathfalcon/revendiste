import {GetEventByIdResponse} from '~/lib';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {ExternalLink} from 'lucide-react';

type EventDescriptionProps = Pick<
  GetEventByIdResponse,
  'description' | 'externalUrl'
>;

export const EventDescription = (props: EventDescriptionProps) => {
  const {description, externalUrl} = props;

  return (
    <div className='flex flex-col gap-4'>
      {/* Description Accordion */}
      <Accordion
        type='single'
        collapsible
        defaultValue={undefined}
        className='w-full'
      >
        <AccordionItem value='description' className='border-none'>
          <AccordionTrigger className='py-2 hover:no-underline'>
            <h2 className='font-medium text-base md:text-lg'>Descripción</h2>
          </AccordionTrigger>
          <AccordionContent className='pt-2'>
            <p
              className={`opacity-75 text-sm ${description ? '' : 'text-muted-foreground'} whitespace-pre-line`}
              title={description ?? 'Sin descripción'}
            >
              {description ?? 'Sin descripción'}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Official Sale Link */}
      {externalUrl && (
        <a
          href={externalUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
        >
          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border shrink-0'>
            <ExternalLink className='w-4 h-4 text-muted-foreground' />
          </div>
          <div className='flex-1'>
            <p className='text-sm font-medium'>¿Preferis la venta oficial?</p>
            <p className='text-xs text-muted-foreground'>
              Ir al sitio del organizador
            </p>
          </div>
        </a>
      )}
    </div>
  );
};
