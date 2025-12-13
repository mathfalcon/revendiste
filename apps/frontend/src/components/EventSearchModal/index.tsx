import {useRef, useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useDebounceCallback, useOnClickOutside} from 'usehooks-ts';
import {getEventBySearchQuery} from '~/lib';
import {Command, CommandList, CommandItem, CommandInput} from '../ui/command';
import {Link, useNavigate} from '@tanstack/react-router';
import {TextEllipsis} from '../ui/text-ellipsis';

interface EventSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventSearchModal = ({
  open,
  onOpenChange,
}: EventSearchModalProps) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const debouncedSetSearchValue = useDebounceCallback(
    setDebouncedSearchValue,
    500,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const eventsQuery = useQuery(getEventBySearchQuery(debouncedSearchValue));
  const navigate = useNavigate();
  const events = eventsQuery.data ?? [];

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setInputValue('');
      setDebouncedSearchValue('');
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  useOnClickOutside(modalContentRef as React.RefObject<HTMLElement>, () => {
    if (open) {
      onOpenChange(false);
    }
  });

  const handleEventSelect = async (eventId: string) => {
    await navigate({
      to: '/eventos/$eventId',
      params: {eventId},
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in fade-in-0'>
      <div className='flex flex-col h-full w-full items-center justify-start pt-20 px-4'>
        <div className='w-full max-w-2xl'>
          <Command
            className='bg-background'
            shouldFilter={false}
            loop
            ref={modalContentRef}
          >
            <CommandInput
              ref={inputRef}
              id='event-search-modal'
              name='event-search-modal'
              placeholder='¿A qué fiesta te sumás?'
              value={inputValue}
              onValueChange={value => {
                setInputValue(value);
                debouncedSetSearchValue(value);
              }}
              autoComplete='off'
              className='h-12 text-lg'
            />

            {debouncedSearchValue && (
              <CommandList className='mt-4 max-h-[60vh] overflow-y-auto'>
                {eventsQuery.isLoading ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                    <div className='flex items-center justify-center gap-2'>
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                      Buscando...
                    </div>
                  </div>
                ) : events.length === 0 ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                    No se encontraron eventos
                  </div>
                ) : (
                  events.map(event => {
                    const flyerImage = event.eventImages[0] ?? null;

                    return (
                      <CommandItem
                        key={event.id}
                        value={event.name}
                        className='flex p-0'
                        onSelect={() => handleEventSelect(event.id)}
                      >
                        <Link
                          to='/eventos/$eventId'
                          params={{eventId: event.id}}
                          className='flex w-full gap-3 p-3 items-center hover:bg-accent rounded-md'
                        >
                          {flyerImage && (
                            <div className='h-12 w-12 shrink-0 flex-shrink-0 overflow-hidden rounded'>
                              <img
                                src={flyerImage.url}
                                alt={event.name}
                                className='h-full w-full object-cover'
                              />
                            </div>
                          )}
                          <div className='flex flex-col min-w-0 flex-1 overflow-hidden'>
                            <TextEllipsis maxLines={1} className='font-medium'>
                              {event.name}
                            </TextEllipsis>
                            {event.venueName && (
                              <span className='text-sm text-muted-foreground truncate'>
                                {event.venueName}
                              </span>
                            )}
                          </div>
                        </Link>
                      </CommandItem>
                    );
                  })
                )}
              </CommandList>
            )}
          </Command>
        </div>
      </div>
    </div>
  );
};
