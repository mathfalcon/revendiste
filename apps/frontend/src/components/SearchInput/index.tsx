import {cx} from 'class-variance-authority';
import {useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useDebounceCallback, useOnClickOutside} from 'usehooks-ts';
import {getEventBySearchQuery} from '~/lib';
import {Command, CommandList, CommandItem, CommandInput} from '../ui/command';
import {Link, useNavigate} from '@tanstack/react-router';
import {TextEllipsis} from '../ui/text-ellipsis';

export const EventSearchInput = (props: React.ComponentProps<'input'>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const debounced = useDebounceCallback(setValue, 500);

  const eventsQuery = useQuery(getEventBySearchQuery(value));
  const navigate = useNavigate();
  const events = eventsQuery.data ?? [];

  useOnClickOutside(
    ref as React.RefObject<HTMLElement>,
    () => setIsFocused(false),
  );

  return (
    <div className='relative w-full' ref={ref}>
      <Command className='bg-background' shouldFilter={false} loop>
        <CommandInput
          id='event-search'
          name='event-search'
          placeholder='Buscar'
          defaultValue={value}
          onValueChange={value => debounced(value)}
          onFocus={() => setIsFocused(true)}
          autoComplete='off'
          className={cx('h-8 pe-1', props.className)}
        />
        {isFocused && (
          <CommandList className='absolute bg-background w-full rounded-md top-full mt-2 py-1.5 px-1'>
            {events.map(event => {
              const flyerImage = event.eventImages[0] ?? null;

              const handleSelect = () => {
                void navigate({
                  to: '/eventos/$eventId',
                  params: {eventId: event.id},
                });
                setIsFocused(false);
              };

              return (
                <CommandItem
                  key={event.id}
                  value={event.name}
                  className='flex'
                  onSelect={handleSelect}
                >
                  <Link
                    to='/eventos/$eventId'
                    params={{eventId: event.id}}
                    key={event.id}
                    className='flex w-full gap-3 h-[32px] items-center'
                  >
                    {flyerImage && (
                      <div className='h-8 w-8 shrink-0 flex-shrink-0 overflow-hidden rounded'>
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
                        <span className='text-xs text-muted-foreground truncate'>
                          {event.venueName}
                        </span>
                      )}
                    </div>
                  </Link>
                </CommandItem>
              );
            })}
          </CommandList>
        )}
      </Command>
    </div>
  );
};
