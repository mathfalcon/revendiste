import {useRef, useState, useEffect, useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useDebounceCallback, useOnClickOutside} from 'usehooks-ts';
import {getEventBySearchQuery} from '~/lib';
import posthog from 'posthog-js';
import {Command, CommandList, CommandItem, CommandInput} from '../ui/command';
import {Link, useNavigate} from '@tanstack/react-router';
import {TextEllipsis} from '../ui/text-ellipsis';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';

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
  const [selectedValue, setSelectedValue] = useState('');
  const debouncedSetSearchValue = useDebounceCallback((value: string) => {
    setDebouncedSearchValue(value);
    if (value.trim()) {
      posthog.capture('search_performed', {query: value.trim()});
    }
  }, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  const eventsQuery = useQuery(getEventBySearchQuery(debouncedSearchValue));
  const navigate = useNavigate();
  const events = eventsQuery.data ?? [];

  // Handle input blur (iOS "Done" button closes keyboard)
  const handleInputBlur = useCallback(() => {
    // Small delay to check if a selection is happening
    setTimeout(() => {
      if (!isSelectingRef.current && open) {
        onOpenChange(false);
      }
      isSelectingRef.current = false;
    }, 100);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open && inputRef.current) {
      // Use requestAnimationFrame for smoother focus timing
      // This works better on mobile than setTimeout
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
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
    isSelectingRef.current = true;
    posthog.capture('search_result_clicked', {
      query: debouncedSearchValue,
      event_id: eventId,
      result_count: events.length,
    });
    await navigate({
      to: '/eventos/$eventId',
      params: {eventId},
    });
    onOpenChange(false);
  };

  // Mark as selecting when user starts interacting with results
  const handleResultInteractionStart = () => {
    isSelectingRef.current = true;
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
            value={selectedValue}
            onValueChange={setSelectedValue}
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
              onBlur={handleInputBlur}
              autoComplete='off'
              autoFocus
              className='h-12 text-lg'
            />

            <CommandList className='mt-4 max-h-[60vh] overflow-y-auto'>
              {/* Section header */}
              {!debouncedSearchValue && events.length > 0 && (
                <p className='px-3 py-2 text-xs font-medium text-muted-foreground'>
                  Próximos eventos
                </p>
              )}

              {eventsQuery.isLoading ? (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    {debouncedSearchValue ? 'Buscando...' : 'Cargando...'}
                  </div>
                </div>
              ) : events.length === 0 && debouncedSearchValue ? (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  No se encontraron eventos
                </div>
              ) : (
                events.map(event => {
                  const flyerImage = event.eventImages[0] ?? null;
                  const eventDate = format(
                    new Date(event.eventStartDate),
                    "d 'de' MMMM 'a las' HH:mm",
                    {locale: es},
                  );

                  return (
                    <CommandItem
                      key={event.id}
                      value={event.id}
                      className='flex p-0'
                      onSelect={() => handleEventSelect(event.id)}
                    >
                        <Link
                          to='/eventos/$eventId'
                          params={{eventId: event.id}}
                          className='flex w-full gap-3 p-3 items-center hover:bg-accent rounded-md'
                          onMouseDown={handleResultInteractionStart}
                          onTouchStart={handleResultInteractionStart}
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
                          <span className='text-sm text-muted-foreground truncate'>
                            {eventDate}
                          </span>
                        </div>
                      </Link>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </div>
      </div>
    </div>
  );
};
