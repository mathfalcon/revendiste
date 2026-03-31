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
  const [searchValue, setSearchValue] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const debounced = useDebounceCallback(setSearchValue, 500);

  const eventsQuery = useQuery(getEventBySearchQuery(searchValue));
  const navigate = useNavigate();
  const events = eventsQuery.data ?? [];

  useOnClickOutside(
    ref as React.RefObject<HTMLElement>,
    () => setIsFocused(false),
  );

  return (
    <div className='relative w-full' ref={ref}>
      <Command
        className='bg-background'
        shouldFilter={false}
        loop
        value={selectedValue}
        onValueChange={setSelectedValue}
      >
        <CommandInput
          id='event-search'
          name='event-search'
          placeholder={props.placeholder || 'Buscar'}
          defaultValue={searchValue}
          onValueChange={val => debounced(val)}
          onFocus={() => setIsFocused(true)}
          autoComplete='off'
          className={cx('h-8 pe-1', props.className)}
        />
        {isFocused && (
          <CommandList className='absolute bg-background w-full rounded-md top-full mt-2 py-1.5 px-1'>
            {events.map(event => {
              const eventImage = event.eventImages[0] ?? null;

              const handleSelect = () => {
                void navigate({
                  to: '/eventos/$slug',
                  params: {slug: event.slug},
                });
                setIsFocused(false);
              };

              return (
                <CommandItem
                  key={event.id}
                  value={event.id}
                  className='flex'
                  onSelect={handleSelect}
                >
                  <Link
                    to='/eventos/$slug'
                    params={{slug: event.slug}}
                    key={event.id}
                    className='flex w-full gap-3 h-[32px] items-center'
                  >
                    {eventImage && (
                      <div className='h-8 w-8 shrink-0 overflow-hidden rounded'>
                        <img
                          src={eventImage.url}
                          alt={event.name}
                          className='h-full w-full object-fill'
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
