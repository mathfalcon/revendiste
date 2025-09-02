import {SearchIcon} from 'lucide-react';
import {Input} from '../ui/input';
import {cx} from 'class-variance-authority';
import {useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useDebounceCallback, useOnClickOutside} from 'usehooks-ts';
import {getEventBySearchQuery} from '~/lib';
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandInput,
} from '../ui/command';
import {useNavigate} from '@tanstack/react-router';

export const EventSearchInput = (props: React.ComponentProps<'input'>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const debounced = useDebounceCallback(setValue, 500);

  const eventsQuery = useQuery(getEventBySearchQuery(value));
  const navigate = useNavigate();
  const events = eventsQuery.data ?? [];

  // @ts-expect-error - bad types
  useOnClickOutside(ref, () => setIsFocused(false));

  return (
    <div className='relative w-full' ref={ref}>
      <Command className='bg-background'>
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
          <CommandList className='absolute bg-background w-full rounded-md top-full mt-2'>
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
                  onClick={() => {
                    console.log('onClick');
                  }}
                >
                  {flyerImage && (
                    <img
                      src={flyerImage.url}
                      alt={event.name}
                      width={32}
                      height='auto'
                    />
                  )}
                  <div className='flex flex-col'>
                    <span className='font-medium'>{event.name}</span>
                    {event.venueName && (
                      <span className='text-xs text-muted-foreground'>
                        {event.venueName}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandList>
        )}
      </Command>
    </div>
  );
};
